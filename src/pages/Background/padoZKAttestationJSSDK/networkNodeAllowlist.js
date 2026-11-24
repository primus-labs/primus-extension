import { ethers } from 'ethers';
import nodeContractAbi from './networkNodeContractAbi.json';
import {
  getAllNetworkChainConfigs,
  getNetworkChainConfig,
  MAX_NODE_ATTESTOR_INDEX,
  NETWORK_ALLOWLIST_INIT_SINGLE_CHAIN_TIMEOUT_MS,
  NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS,
  NETWORK_NODE_ALLOWLIST_STORAGE_KEY,
  parseInitChainId,
} from './networkChainConfig';
import { withTimeout } from './networkAllowlistUtils';
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

/** @type {Map<number, Promise<string[]>>} */
const inFlightRefreshByChain = new Map();

export { withTimeout, parseInitChainId };

/**
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
 * @param {number} chainId
 * @param {string[]} hosts
 */
export async function mergeChainHostsIntoStorage(chainId, hosts) {
  const key = String(chainId);
  const { byChainId } = await readAllowlistCache();
  const nextByChainId = { ...byChainId, [key]: Array.isArray(hosts) ? hosts : [] };
  const payload = {
    updatedAt: Date.now(),
    byChainId: nextByChainId,
  };
  await safeStorageSet({
    [NETWORK_NODE_ALLOWLIST_STORAGE_KEY]: payload,
  });
  return payload;
}

/**
 * @param {number | string} chainId
 * @returns {Promise<string[]>}
 */
export async function getAllowedHostsForChainId(chainId) {
  const key = String(chainId);
  const { byChainId } = await readAllowlistCache();
  return Array.isArray(byChainId[key]) ? byChainId[key] : [];
}

/**
 * @param {import('ethers').providers.Provider} provider
 * @param {string} contractAddress
 * @param {number} chainId
 * @returns {Promise<Set<string>>}
 */
async function fetchAllowedHostsOnChain(provider, contractAddress, chainId) {
  const contract = new ethers.Contract(contractAddress, nodeContractAbi, provider);
  /** @type {string[]} */
  const attestorAddresses = [];

  for (let i = 0; i < MAX_NODE_ATTESTOR_INDEX; i++) {
    let attestor;
    try {
      attestor = await contract.nodeAttestors(i);
    } catch {
      break;
    }

    if (!attestor || attestor === ZERO_ADDRESS) {
      break;
    }
    attestorAddresses.push(attestor);
  }

  const nodeInfoResults = await Promise.all(
    attestorAddresses.map(async (attestor) => {
      try {
        const info = await contract.getNodeInfo(attestor);
        const status = Number(info?.status ?? info?.[1]);
        const urls = info?.urls ?? info?.[6] ?? [];
        const urlList = Array.isArray(urls) ? urls : [];
        return { status, urls: urlList };
      } catch {
        return null;
      }
    })
  );

  const hosts = new Set();
  nodeInfoResults.filter(Boolean).forEach((row) => {
    const rowHosts = collectHostsFromNodeInfoRows([row]);
    rowHosts.forEach((h) => hosts.add(h));
  });

  return hosts;
}

/**
 * @param {number} chainId
 * @returns {Promise<string[]>}
 */
async function refreshChainAllowlistRpc(chainId) {
  const config = getNetworkChainConfig(chainId);
  if (!config) {
    return [];
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const hosts = await fetchAllowedHostsOnChain(
      provider,
      config.nodeContractAddress,
      chainId
    );
    return [...hosts];
  } catch {
    return [];
  }
}

/**
 * Deduplicated refresh + storage merge for one chain.
 * @param {number} chainId
 * @returns {Promise<string[]>}
 */
export function refreshChainWithPersist(chainId) {
  const existing = inFlightRefreshByChain.get(chainId);
  if (existing) {
    return existing;
  }

  const work = (async () => {
    const hosts = await refreshChainAllowlistRpc(chainId);
    await mergeChainHostsIntoStorage(chainId, hosts);
    return hosts;
  })()
    .catch(() => [])
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
 * @returns {Promise<void>}
 */
export async function ensureChainAllowlistForStart(chainId) {
  const hosts = await getAllowedHostsForChainId(chainId);
  if (hosts.length > 0) {
    return;
  }

  const inFlight = inFlightRefreshByChain.get(chainId);
  const refreshPromise = inFlight || refreshChainWithPersist(chainId);

  try {
    await withTimeout(refreshPromise, NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS);
  } catch {
    // validation fails closed if cache still empty
  }
}

/**
 * @deprecated Prefer refreshAllChainsBackground / refreshSingleChainForInit
 * @returns {Promise<{ updatedAt: number; byChainId: Record<string, string[]> }>}
 */
export async function refreshAllChainsNodeAllowlist() {
  const configs = getAllNetworkChainConfigs();
  await Promise.all(configs.map((cfg) => refreshChainWithPersist(cfg.chainId)));
  const { updatedAt, byChainId } = await readAllowlistCache();
  return { updatedAt: updatedAt ?? Date.now(), byChainId };
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

/** @param {number} chainId @returns {Promise<string[]> | undefined} */
export function getInFlightRefresh(chainId) {
  return inFlightRefreshByChain.get(chainId);
}