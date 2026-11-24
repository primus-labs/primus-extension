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

/**
 * Solidity panic code 0x32 means an array index is out of bounds.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isArrayOutOfBoundsPanic(error) {
  let current = error;
  let data;
  const seen = new Set();
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    if (typeof current.data === 'string') {
      data = current.data;
      break;
    }
    current = current.error;
  }
  if (typeof data !== 'string' || !data.toLowerCase().startsWith('0x4e487b71')) {
    return false;
  }
  return Number.parseInt(data.slice(-64), 16) === 0x32;
}

/**
 * Some public RPCs strip Solidity panic data and expose only CALL_EXCEPTION
 * plus a nested JSON-RPC "execution reverted" error.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isArrayReadEndError(error) {
  if (isArrayOutOfBoundsPanic(error)) return true;

  let current = error;
  let callExceptionWithoutData = false;
  let executionReverted = false;
  const seen = new Set();
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    if (current.code === 'CALL_EXCEPTION' && current.data === '0x') {
      callExceptionWithoutData = true;
    }
    if (
      current.code === 3 &&
      String(current.message || '').toLowerCase().includes('execution reverted')
    ) {
      executionReverted = true;
    }
    current = current.error;
  }
  return callExceptionWithoutData && executionReverted;
}

/**
 * @template T
 * @param {(index: number) => Promise<T>} reader
 * @param {(error: unknown) => boolean} isEnd
 * @returns {Promise<T[]>}
 */
export async function readSequentiallyUntilEnd(reader, isEnd) {
  const results = [];
  for (let index = 0; ; index++) {
    try {
      results.push(await reader(index));
    } catch (error) {
      if (isEnd(error)) return results;
      throw error;
    }
  }
}

/**
 * @param {{ hosts?: unknown; refreshedAt?: unknown; legacy?: boolean } | null} cache
 * @param {number} now
 * @param {number} freshTtlMs
 * @param {number} maxStaleMs
 * @returns {'missing' | 'fresh' | 'stale' | 'expired'}
 */
export function getAllowlistCacheState(
  cache,
  now,
  freshTtlMs,
  maxStaleMs
) {
  if (!cache || !Array.isArray(cache.hosts)) return 'missing';
  const refreshedAt = Number(cache.refreshedAt);
  if (!Number.isFinite(refreshedAt) || refreshedAt <= 0) return 'expired';
  const age = Math.max(0, now - refreshedAt);
  if (!cache.legacy && age <= freshTtlMs) return 'fresh';
  return age <= maxStaleMs ? 'stale' : 'expired';
}