/**
 * Pure helpers for allowlist refresh (safe to unit-test without webpack aliases).
 */

/**
 * @param {Promise<T>} promise
 * @param {number} timeoutMs
 * @returns {Promise<T>}
 */
export function withTimeout(promise, timeoutMs) {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

/**
 * @param {unknown} chainId
 * @param {(id: number) => boolean} isSupportedChain
 * @returns {number | null}
 */
export function parseInitChainIdValue(chainId, isSupportedChain) {
  if (chainId == null || chainId === '') return null;
  const num = Number(chainId);
  if (!Number.isFinite(num)) return null;
  return isSupportedChain(num) ? num : null;
}