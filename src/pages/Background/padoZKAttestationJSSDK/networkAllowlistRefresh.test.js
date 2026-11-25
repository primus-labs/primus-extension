import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureAllowlistForStart,
  getAllowlistCacheState,
  isArrayOutOfBoundsPanic,
  isArrayReadEndError,
  parseInitChainIdValue,
  readInBatches,
  readInBatchesUntilEnd,
  readFromFallbacks,
  readSequentiallyUntilEnd,
  resolveCachedAllowlist,
  withTimeout,
} from './networkAllowlistUtils.js';
import {
  getNetworkChainConfig,
  NETWORK_ALLOWLIST_FRESH_TTL_MS,
  NETWORK_ALLOWLIST_MAX_STALE_MS,
  NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS,
  NETWORK_NODE_READ_BATCH_SIZE,
} from './networkChainConfig.js';

const SUPPORTED = new Set([84532, 8453, 133, 177]);
const isSupported = (id) => SUPPORTED.has(id);

describe('networkAllowlistRefresh', () => {
  it('configures multiple RPC fallbacks for every supported chain', () => {
    for (const chainId of SUPPORTED) {
      assert.ok(getNetworkChainConfig(chainId).rpcUrls.length >= 2);
    }
  });

  it('parseInitChainIdValue accepts supported chainId only', () => {
    assert.equal(parseInitChainIdValue(8453, isSupported), 8453);
    assert.equal(parseInitChainIdValue('84532', isSupported), 84532);
    assert.equal(parseInitChainIdValue(999999, isSupported), null);
    assert.equal(parseInitChainIdValue(null, isSupported), null);
  });

  it('withTimeout resolves when promise completes in time', async () => {
    const result = await withTimeout(Promise.resolve(42), 100);
    assert.equal(result, 42);
  });

  it('withTimeout rejects when promise exceeds deadline', async () => {
    await assert.rejects(
      () =>
        withTimeout(
          new Promise((resolve) => setTimeout(() => resolve('late'), 200)),
          50
        ),
      /timeout/
    );
  });

  it('classifies fresh, stale, expired, and legacy cache entries', () => {
    const now = 1_000_000;
    const freshTtl = 100;
    const maxStale = 500;
    assert.equal(
      getAllowlistCacheState(
        { hosts: ['node'], refreshedAt: now - 50 },
        now,
        freshTtl,
        maxStale
      ),
      'fresh'
    );
    assert.equal(
      getAllowlistCacheState(
        { hosts: ['node'], refreshedAt: now - 200 },
        now,
        freshTtl,
        maxStale
      ),
      'stale'
    );
    assert.equal(
      getAllowlistCacheState(
        { hosts: ['node'], refreshedAt: now - 50, legacy: true },
        now,
        freshTtl,
        maxStale
      ),
      'stale'
    );
    assert.equal(
      getAllowlistCacheState(
        { hosts: ['node'], refreshedAt: now - 501 },
        now,
        freshTtl,
        maxStale
      ),
      'expired'
    );
  });

  it('does not use a stale cache after it expires while refresh is pending', () => {
    const cache = { hosts: ['node'], refreshedAt: 500 };
    assert.deepEqual(resolveCachedAllowlist(cache, 999, 100, 500), {
      status: 'stale',
      hosts: ['node'],
    });
    assert.deepEqual(resolveCachedAllowlist(cache, 1001, 100, 500), {
      status: 'unavailable',
      hosts: [],
    });
  });

  it('recognizes only Solidity array out-of-bounds panic', () => {
    const panic32 = `0x4e487b71${'0'.repeat(62)}32`;
    const panic11 = `0x4e487b71${'0'.repeat(62)}11`;
    assert.equal(isArrayOutOfBoundsPanic({ error: { data: panic32 } }), true);
    assert.equal(isArrayOutOfBoundsPanic({ data: panic11 }), false);
    assert.equal(isArrayOutOfBoundsPanic({ code: 'NETWORK_ERROR' }), false);
  });

  it('recognizes the stripped out-of-range error returned by public RPCs', () => {
    const error = {
      code: 'CALL_EXCEPTION',
      data: '0x',
      error: {
        code: 'SERVER_ERROR',
        error: { code: 3, message: 'execution reverted' },
      },
    };
    assert.equal(isArrayReadEndError(error), true);
    assert.equal(
      isArrayReadEndError({ code: 'NETWORK_ERROR', message: 'timeout' }),
      false
    );
  });

  it('reads sequentially beyond 256 entries and stops at the first missing index', async () => {
    const endError = {
      code: 'CALL_EXCEPTION',
      data: '0x',
      error: { error: { code: 3, message: 'execution reverted' } },
    };
    const values = await readSequentiallyUntilEnd(async (index) => {
      if (index === 300) throw endError;
      return `node-${index}`;
    }, isArrayReadEndError);
    assert.equal(values.length, 300);
    assert.equal(values[299], 'node-299');
  });

  it('propagates transient sequential read failures instead of treating them as end', async () => {
    await assert.rejects(
      () =>
        readSequentiallyUntilEnd(async (index) => {
          if (index === 2) throw new Error('temporary RPC failure');
          return `node-${index}`;
        }, isArrayReadEndError),
      /temporary RPC failure/
    );
  });

  it('completes delayed full cold-start discovery with bounded concurrency', async () => {
    const endError = {
      code: 'CALL_EXCEPTION',
      data: '0x',
      error: { error: { code: 3, message: 'execution reverted' } },
    };
    let activeReads = 0;
    let maxActiveReads = 0;
    const readWithDelay = async (value) => {
      activeReads += 1;
      maxActiveReads = Math.max(maxActiveReads, activeReads);
      await new Promise((resolve) => setTimeout(resolve, 10));
      activeReads -= 1;
      return value;
    };
    const values = await withTimeout(
      (async () => {
        const addresses = await readInBatchesUntilEnd(
          async (index) => {
            await readWithDelay();
            if (index >= 50) throw endError;
            return `node-${index}`;
          },
          isArrayReadEndError,
          NETWORK_NODE_READ_BATCH_SIZE
        );
        return readInBatches(
          addresses.length,
          (index) => readWithDelay({ address: addresses[index] }),
          NETWORK_NODE_READ_BATCH_SIZE
        );
      })(),
      250
    );

    assert.equal(values.length, 50);
    assert.equal(values[49].address, 'node-49');
    assert.equal(maxActiveReads, NETWORK_NODE_READ_BATCH_SIZE);
    assert.equal(NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS, 12000);
  });

  it('propagates batched RPC failures before the array end', async () => {
    const endError = {
      code: 'CALL_EXCEPTION',
      data: '0x',
      error: { error: { code: 3, message: 'execution reverted' } },
    };
    await assert.rejects(
      () =>
        readInBatchesUntilEnd(
          async (index) => {
            if (index === 2) throw new Error('temporary RPC failure');
            if (index >= 3) throw endError;
            return `node-${index}`;
          },
          isArrayReadEndError,
          5
        ),
      /temporary RPC failure/
    );
  });

  it('reads more than 256 entries through the production batched path', async () => {
    const values = await readInBatchesUntilEnd(
      async (index) => {
        if (index >= 300) {
          throw {
            code: 'CALL_EXCEPTION',
            data: '0x',
            error: { error: { code: 3, message: 'execution reverted' } },
          };
        }
        return `node-${index}`;
      },
      isArrayReadEndError,
      NETWORK_NODE_READ_BATCH_SIZE
    );
    assert.equal(values.length, 300);
    assert.equal(values[299], 'node-299');
  });

  it('stops batched reads on a Solidity out-of-bounds panic', async () => {
    const panicData = `0x4e487b71${'0'.repeat(62)}32`;
    const values = await readInBatchesUntilEnd(
      async (index) => {
        if (index >= 3) throw { data: panicData };
        return `node-${index}`;
      },
      isArrayReadEndError,
      NETWORK_NODE_READ_BATCH_SIZE
    );
    assert.deepEqual(values, ['node-0', 'node-1', 'node-2']);
  });

  it('falls back to the next RPC after a failure', async () => {
    const attempts = [];
    const value = await readFromFallbacks(
      ['rpc-1', 'rpc-2'],
      async (rpcUrl) => {
        attempts.push(rpcUrl);
        if (rpcUrl === 'rpc-1') throw new Error('unavailable');
        return 'ready';
      }
    );
    assert.equal(value, 'ready');
    assert.deepEqual(attempts, ['rpc-1', 'rpc-2']);
  });

  it('uses one refresh promise for a missing-cache start', async () => {
    let refreshCalls = 0;
    const result = await ensureAllowlistForStart({
      chainId: 8453,
      readCache: async () => null,
      getRefreshPromise: () => {
        refreshCalls += 1;
        return Promise.resolve({ hosts: ['node.example'], snapshotAt: 1 });
      },
      freshTtlMs: NETWORK_ALLOWLIST_FRESH_TTL_MS,
      maxStaleMs: NETWORK_ALLOWLIST_MAX_STALE_MS,
      refreshTimeoutMs: NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS,
    });
    assert.deepEqual(result, {
      status: 'ready',
      hosts: ['node.example'],
    });
    assert.equal(refreshCalls, 1);
  });

  it('uses fresh cache without starting a refresh', async () => {
    let refreshCalls = 0;
    const now = 1_000_000;
    const result = await ensureAllowlistForStart({
      chainId: 8453,
      readCache: async () => ({
        hosts: ['cached.example'],
        refreshedAt: now,
      }),
      getRefreshPromise: () => {
        refreshCalls += 1;
        return Promise.resolve({ hosts: [], snapshotAt: now });
      },
      freshTtlMs: NETWORK_ALLOWLIST_FRESH_TTL_MS,
      maxStaleMs: NETWORK_ALLOWLIST_MAX_STALE_MS,
      refreshTimeoutMs: NETWORK_ALLOWLIST_START_REFRESH_TIMEOUT_MS,
      now: () => now,
    });
    assert.deepEqual(result, {
      status: 'ready',
      hosts: ['cached.example'],
    });
    assert.equal(refreshCalls, 0);
  });

  it('returns stale cache when a start refresh times out', async () => {
    const now = 1_000_000;
    const staleCache = {
      hosts: ['stale.example'],
      refreshedAt: now - NETWORK_ALLOWLIST_FRESH_TTL_MS - 1,
    };
    const result = await ensureAllowlistForStart({
      chainId: 8453,
      readCache: async () => staleCache,
      getRefreshPromise: () => new Promise(() => {}),
      freshTtlMs: NETWORK_ALLOWLIST_FRESH_TTL_MS,
      maxStaleMs: NETWORK_ALLOWLIST_MAX_STALE_MS,
      refreshTimeoutMs: 1,
      now: () => now,
    });
    assert.deepEqual(result, {
      status: 'stale',
      hosts: ['stale.example'],
    });
  });
});