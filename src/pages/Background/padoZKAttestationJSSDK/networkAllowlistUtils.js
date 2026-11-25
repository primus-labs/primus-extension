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
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`timeout after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  return Promise.race([
    promise,
    timeout,
  ]).finally(() => clearTimeout(timer));
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
 * Reads a contiguous contract array in bounded parallel batches.
 * Results after the first out-of-bounds index are ignored.
 * @template T
 * @param {(index: number) => Promise<T>} reader
 * @param {(error: unknown) => boolean} isEnd
 * @param {number} batchSize
 * @returns {Promise<T[]>}
 */
export async function readInBatchesUntilEnd(reader, isEnd, batchSize) {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new RangeError('batchSize must be a positive integer');
  }

  const results = [];
  for (let start = 0; ; start += batchSize) {
    const batch = await Promise.allSettled(
      Array.from({ length: batchSize }, (_, offset) => reader(start + offset))
    );
    const endOffset = batch.findIndex(
      (entry) => entry.status === 'rejected' && isEnd(entry.reason)
    );
    const valueCount = endOffset === -1 ? batch.length : endOffset;

    for (let offset = 0; offset < valueCount; offset++) {
      const entry = batch[offset];
      if (entry.status === 'rejected') throw entry.reason;
      results.push(entry.value);
    }
    if (endOffset !== -1) return results;
  }
}

/**
 * Maps a known number of entries with bounded concurrency.
 * @template T
 * @param {number} count
 * @param {(index: number) => Promise<T>} reader
 * @param {number} batchSize
 * @returns {Promise<T[]>}
 */
export async function readInBatches(count, reader, batchSize) {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new RangeError('batchSize must be a positive integer');
  }

  const results = [];
  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(start + batchSize, count);
    const batch = Array.from({ length: end - start }, (_, offset) =>
      reader(start + offset)
    );
    results.push(...(await Promise.all(batch)));
  }
  return results;
}

/**
 * Tries values in order and returns the first successful result.
 * @template T
 * @param {string[]} values
 * @param {(value: string) => Promise<T>} reader
 * @returns {Promise<T>}
 */
export async function readFromFallbacks(values, reader) {
  let lastError;
  for (const value of values) {
    try {
      return await reader(value);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No fallback available');
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

/**
 * @param {{ hosts?: unknown; refreshedAt?: unknown; legacy?: boolean } | null} cache
 * @param {number} now
 * @param {number} freshTtlMs
 * @param {number} maxStaleMs
 * @returns {{ status: 'ready' | 'stale' | 'unavailable'; hosts: string[] }}
 */
export function resolveCachedAllowlist(
  cache,
  now,
  freshTtlMs,
  maxStaleMs
) {
  const state = getAllowlistCacheState(
    cache,
    now,
    freshTtlMs,
    maxStaleMs
  );
  if (state === 'fresh') return { status: 'ready', hosts: cache.hosts };
  if (state === 'stale') return { status: 'stale', hosts: cache.hosts };
  return { status: 'unavailable', hosts: [] };
}

/**
 * Testable start-path policy around cache, refresh and timeout.
 * @param {{
 *   chainId: number;
 *   readCache: (chainId: number) => Promise<{ hosts: string[]; refreshedAt: number; legacy?: boolean } | null>;
 *   getRefreshPromise: () => Promise<{ hosts: string[]; snapshotAt: number }>;
 *   freshTtlMs: number;
 *   maxStaleMs: number;
 *   refreshTimeoutMs: number;
 *   now?: () => number;
 *   timeout?: typeof withTimeout;
 * }} options
 * @returns {Promise<{ status: 'ready' | 'stale' | 'unavailable'; hosts: string[] }>}
 */
export async function ensureAllowlistForStart(options) {
  const now = options.now || Date.now;
  const timeout = options.timeout || withTimeout;
  const cache = await options.readCache(options.chainId);
  const cacheState = getAllowlistCacheState(
    cache,
    now(),
    options.freshTtlMs,
    options.maxStaleMs
  );
  if (cacheState === 'fresh') {
    return { status: 'ready', hosts: cache.hosts };
  }

  try {
    const result = await timeout(
      options.getRefreshPromise(),
      options.refreshTimeoutMs
    );
    return { status: 'ready', hosts: result.hosts };
  } catch {
    const latestCache = await options.readCache(options.chainId);
    return resolveCachedAllowlist(
      latestCache,
      now(),
      options.freshTtlMs,
      options.maxStaleMs
    );
  }
}