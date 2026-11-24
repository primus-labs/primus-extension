import { ethers } from 'ethers';
import nodeContractAbi from './networkNodeContractAbi.json';
import {
  getAllNetworkChainConfigs,
  getNetworkChainConfig,
  NETWORK_ALLOWLIST_FRESH_TTL_MS,
  NETWORK_ALLOWLIST_INIT_SINGLE_CHAIN_TIMEOUT_MS,
  NETWORK_ALLOWLIST_MAX_STALE_MS,
  NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS,
  NETWORK_NODE_ALLOWLIST_STORAGE_KEY,
  NETWORK_NODE_ALLOWLIST_STORAGE_KEY_PREFIX,
  NETWORK_NODE_READ_BATCH_SIZE,
  NETWORK_NODE_RPC_RETRIES,
  parseInitChainId,
} from './networkChainConfig';
import {
  getAllowlistCacheState,
  isArrayReadEndError,
  readSequentiallyUntilEnd,
  resolveCachedAllowlist,
  withTimeout,
} from './networkAllowlistUtils';
import {
  collectHostsFromNodeInfoRows,
  normalizeHost,
} from './networkAlgoApiValidate';
import { safeStorageGet, safeStorageSet } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';

export {
  collectHostsFromNodeInfoRows,
  isHostAllowed,
  normalizeHost,
  parseWssHost,
  validateNetworkAlgoApis,
} from './networkAlgoApiValidate';

const ZERO_ADDRESS = ethers.constants.AddressZero;

/** @type {Map<number, Promise<{ hosts: string[]; snapshotAt: number }>>} */
const inFlightRefreshByChain = new Map();

export { withTimeout, parseInitChainId };

/**
 * Legacy shared cache reader. New writes use an independent key per chain.
 * @returns {Promise<{ updatedAt?: number; byChainId: Record<string, string[]> }>}
 */
export async function readAllowlistCache() {
  const stored = await safeStorageGet([NETWORK_NODE_ALLOWLIST_STORAGE_KEY]);
  const payload = stored?.[NETWORK_NODE_ALLOWLIST_STORAGE_KEY];
  if (!payload || typeof payload !== 'object') {
    return { byChainId: {} };
  }
  const byChainId = payload.byChainId && typeof payload.byChainId === 'object' ? payload.byChainId : {};
  return { updatedAt: payload.updatedAt, byChainId };
}

/**
 * @param {number | string} chainId
 * @returns {string}
 */
function getChainStorageKey(chainId) {
  return `${NETWORK_NODE_ALLOWLIST_STORAGE_KEY_PREFIX}${chainId}`;
}

/**
 * @param {number | string} chainId
 * @returns {Promise<{ hosts: string[]; refreshedAt: number; legacy?: boolean } | null>}
 */
export async function readChainAllowlistCache(chainId) {
  const storageKey = getChainStorageKey(chainId);
  const stored = await safeStorageGet([storageKey]);
  const payload = stored?.[storageKey];
  if (payload && typeof payload === 'object' && Array.isArray(payload.hosts)) {
    return {
      hosts: payload.hosts,
      refreshedAt: Number(payload.refreshedAt) || 0,
    };
  }

  const legacy = await readAllowlistCache();
  const hosts = legacy.byChainId[String(chainId)];
  if (!Array.isArray(hosts)) return null;
  return {
    hosts,
    refreshedAt: Number(legacy.updatedAt) || 0,
    legacy: true,
  };
}

/**
 * @param {number} chainId
 * @param {string[]} hosts
 * @param {number} [refreshedAt]
 * @returns {Promise<{ hosts: string[]; refreshedAt: number }>}
 */
export async function writeChainHostsToStorage(
  chainId,
  hosts,
  refreshedAt = Date.now()
) {
  const payload = {
    hosts: Array.isArray(hosts) ? hosts : [],
    refreshedAt,
  };
  await safeStorageSet({
    [getChainStorageKey(chainId)]: payload,
  });
  return payload;
}

/**
 * @param {number | string} chainId
 * @returns {Promise<string[]>}
 */
export async function getAllowedHostsForChainId(chainId) {
  const cache = await readChainAllowlistCache(chainId);
  return cache?.hosts || [];
}

/** @param {number} ms @returns {Promise<void>} */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
async function retryRpc(operation) {
  let lastError;
  for (let attempt = 0; attempt < NETWORK_NODE_RPC_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (isArrayReadEndError(error)) throw error;
      lastError = error;
      if (attempt < NETWORK_NODE_RPC_RETRIES - 1) {
        await delay(100 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

/**
 * @template T
 * @param {number} count
 * @param {(index: number) => Promise<T>} reader
 * @returns {Promise<T[]>}
 */
async function readInBatches(count, reader) {
  const results = [];
  for (let start = 0; start < count; start += NETWORK_NODE_READ_BATCH_SIZE) {
    const end = Math.min(start + NETWORK_NODE_READ_BATCH_SIZE, count);
    const batch = Array.from({ length: end - start }, (_, offset) =>
      reader(start + offset)
    );
    results.push(...(await Promise.all(batch)));
  }
  return results;
}

/**
 * @param {import('ethers').providers.Provider} provider
 * @param {string} contractAddress
 * @returns {Promise<{ hosts: Set<string>; snapshotAt: number }>}
 */
async function fetchAllowedHostsOnChain(provider, contractAddress) {
  const contract = new ethers.Contract(contractAddress, nodeContractAbi, provider);
  const blockTag = await retryRpc(() => provider.getBlockNumber());
  const snapshotAt = Date.now();
  const attestorAddresses = (
    await readSequentiallyUntilEnd(
      (index) => retryRpc(() => contract.nodeAttestors(index, { blockTag })),
      isArrayReadEndError
    )
  ).filter((attestor) => attestor && attestor !== ZERO_ADDRESS);

  const nodeInfoResults = await readInBatches(
    attestorAddresses.length,
    async (index) => {
      const info = await retryRpc(() =>
        contract.getNodeInfo(attestorAddresses[index], { blockTag })
      );
      const status = Number(info?.status ?? info?.[1]);
      const urls = info?.urls ?? info?.[6] ?? [];
      return { status, urls: Array.isArray(urls) ? urls : [] };
    }
  );

  return {
    hosts: collectHostsFromNodeInfoRows(nodeInfoResults),
    snapshotAt,
  };
}

/**
 * @param {number} chainId
 * @returns {Promise<{ hosts: string[]; snapshotAt: number }>}
 */
async function refreshChainAllowlistRpc(chainId) {
  const config = getNetworkChainConfig(chainId);
  if (!config) {
    throw new Error(`Unsupported network chainId: ${chainId}`);
  }

  let lastError;
  for (const rpcUrl of config.rpcUrls) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const result = await fetchAllowedHostsOnChain(
        provider,
        config.nodeContractAddress
      );
      return { hosts: [...result.hosts], snapshotAt: result.snapshotAt };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`No RPC available for chainId: ${chainId}`);
}

/**
 * Deduplicated refresh + storage merge for one chain.
 * @param {number} chainId
 * @returns {Promise<{ hosts: string[]; snapshotAt: number }>}
 */
export function refreshChainWithPersist(chainId) {
  const existing = inFlightRefreshByChain.get(chainId);
  if (existing) {
    return existing;
  }

  const work = (async () => {
    const result = await refreshChainAllowlistRpc(chainId);
    await writeChainHostsToStorage(
      chainId,
      result.hosts,
      result.snapshotAt
    );
    return result;
  })()
    .finally(() => {
      inFlightRefreshByChain.delete(chainId);
    });

  inFlightRefreshByChain.set(chainId, work);
  return work;
}

/**
 * @param {number[]} chainIds
 * @returns {Promise<void>}
 */
function refreshChainsParallel(chainIds) {
  return Promise.all(chainIds.map((id) => refreshChainWithPersist(id))).then(() => undefined);
}

/**
 * Fire-and-forget refresh for all supported chains (init without chainId).
 */
export function refreshAllChainsBackground() {
  const chainIds = getAllNetworkChainConfigs().map((c) => c.chainId);
  refreshChainsParallel(chainIds).catch(() => undefined);
}

/**
 * @param {number} chainId
 * @returns {Promise<void>}
 */
export async function refreshSingleChainForInit(chainId) {
  try {
    await withTimeout(
      refreshChainWithPersist(chainId),
      NETWORK_ALLOWLIST_INIT_SINGLE_CHAIN_TIMEOUT_MS
    );
  } catch {
    // init continues; start may补拉 or fail-closed
  }
}

/**
 * Start path: sync refresh when cache missing/empty or await in-flight refresh.
 * @param {number} chainId
 * @returns {Promise<{ status: 'ready' | 'stale' | 'unavailable'; hosts: string[] }>}
 */
export async function ensureChainAllowlistForStart(chainId) {
  const cache = await readChainAllowlistCache(chainId);
  const cacheState = getAllowlistCacheState(
    cache,
    Date.now(),
    NETWORK_ALLOWLIST_FRESH_TTL_MS,
    NETWORK_ALLOWLIST_MAX_STALE_MS
  );
  if (cacheState === 'fresh') {
    return { status: 'ready', hosts: cache.hosts };
  }

  const inFlight = inFlightRefreshByChain.get(chainId);
  const refreshPromise = inFlight || refreshChainWithPersist(chainId);

  try {
    const result = await withTimeout(
      refreshPromise,
      NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS
    );
    return { status: 'ready', hosts: result.hosts };
  } catch {
    const latestCache = await readChainAllowlistCache(chainId);
    return resolveCachedAllowlist(
      latestCache,
      Date.now(),
      NETWORK_ALLOWLIST_FRESH_TTL_MS,
      NETWORK_ALLOWLIST_MAX_STALE_MS
    );
  }
}

/**
 * @deprecated Prefer refreshAllChainsBackground / refreshSingleChainForInit
 * @returns {Promise<{ updatedAt: number; byChainId: Record<string, string[]> }>}
 */
export async function refreshAllChainsNodeAllowlist() {
  const configs = getAllNetworkChainConfigs();
  const entries = await Promise.all(
    configs.map(async (config) => [
      String(config.chainId),
      (await refreshChainWithPersist(config.chainId)).hosts,
    ])
  );
  return { updatedAt: Date.now(), byChainId: Object.fromEntries(entries) };
}

/**
 * @param {unknown} extendedParams
 * @returns {number | null}
 */
export function parseNetworkChainIdFromExtendedParams(extendedParams) {
  const parsed =
    typeof extendedParams === 'string'
      ? safeJsonParse(extendedParams)
      : extendedParams;
  const chainId = parsed?.chainId;
  if (chainId == null || chainId === '') return null;
  const num = Number(chainId);
  return Number.isFinite(num) ? num : null;
}

/** @param {number} chainId @returns {Promise<{ hosts: string[]; snapshotAt: number }> | undefined} */
export function getInFlightRefresh(chainId) {
  return inFlightRefreshByChain.get(chainId);
}