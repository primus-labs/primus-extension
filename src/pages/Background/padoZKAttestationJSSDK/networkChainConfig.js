/**
 * Network SDK chain config — keep in sync with @primuslabs/network-js-sdk SUPPORTEDCHAINIDSMAP.
 * RPC URLs are public endpoints; update with ops if endpoints change.
 */
export const NETWORK_SDK_PACKAGE = '@primuslabs/network-js-sdk';

/** @typedef {{ chainId: number; chainName: string; nodeContractAddress: string; rpcUrls: string[] }} NetworkChainEntry */

const RPC_BY_CHAIN = {
  84532: [
    'https://sepolia.base.org',
    'https://base-sepolia-rpc.publicnode.com',
    'https://base-sepolia.gateway.tenderly.co',
  ],
  8453: [
    'https://mainnet.base.org',
    'https://base-rpc.publicnode.com',
  ],
  133: [
    'https://testnet.hsk.xyz',
    'https://133.rpc.thirdweb.com',
  ],
  177: [
    'https://mainnet.hsk.xyz',
    'https://177.rpc.thirdweb.com',
  ],
};

/** @type {Record<number, Omit<NetworkChainEntry, 'rpcUrls'>>} */
const CHAIN_META = {
  84532: {
    chainId: 84532,
    chainName: 'Base Sepolia',
    nodeContractAddress: '0xF7dc28456B19b2f8ca80B363c911CaDE1FB84bC6',
  },
  8453: {
    chainId: 8453,
    chainName: 'Base',
    nodeContractAddress: '0x9C1bb8197720d08dA6B9dab5704a406a24C97642',
  },
  133: {
    chainId: 133,
    chainName: 'HashKey Chain testnet',
    nodeContractAddress: '0x106a8A53C6B7d8cc11c10152DD297130be6774f6',
  },
  177: {
    chainId: 177,
    chainName: 'HashKey Chain',
    nodeContractAddress: '0x3CF341692deAD89AD0e98141B768eF3Ad89CDCa7',
  },
};

export const NETWORK_NODE_STATUS_REGISTERED = 1;

export const NETWORK_NODE_ALLOWLIST_STORAGE_KEY = 'networkNodeAllowedHosts';

export const NETWORK_NODE_ALLOWLIST_STORAGE_KEY_PREFIX =
  'networkNodeAllowedHosts:';

/** Cache is used without a synchronous refresh within this window. */
export const NETWORK_ALLOWLIST_FRESH_TTL_MS = 5 * 60 * 1000;

/** A failed refresh may fall back to cache only within this total age. */
export const NETWORK_ALLOWLIST_MAX_STALE_MS = 30 * 60 * 1000;

export const NETWORK_NODE_RPC_RETRIES = 3;

export const NETWORK_NODE_READ_BATCH_SIZE = 20;

/** Max wait for single-chain refresh during startAttestation before validation. */
export const NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS = 12000;

/** Max wait for single-chain refresh during init when chainId is provided. */
export const NETWORK_ALLOWLIST_INIT_SINGLE_CHAIN_TIMEOUT_MS = 12000;

/**
 * @param {number} chainId
 * @returns {NetworkChainEntry | null}
 */
export function getNetworkChainConfig(chainId) {
  const meta = CHAIN_META[chainId];
  if (!meta) return null;
  const rpcUrls = RPC_BY_CHAIN[chainId];
  if (!rpcUrls?.length) return null;
  return { ...meta, rpcUrls };
}

/** @returns {NetworkChainEntry[]} */
export function getAllNetworkChainConfigs() {
  return Object.keys(CHAIN_META).map((id) => getNetworkChainConfig(Number(id))).filter(Boolean);
}

/**
 * @param {{ clientType?: string } | null | undefined} params
 * @returns {boolean}
 */
export function isNetworkSdkClient(params) {
  return params?.clientType === NETWORK_SDK_PACKAGE;
}

/**
 * @param {unknown} chainId
 * @returns {number | null}
 */
export function parseInitChainId(chainId) {
  if (chainId == null || chainId === '') return null;
  const num = Number(chainId);
  if (!Number.isFinite(num)) return null;
  return getNetworkChainConfig(num) ? num : null;
}