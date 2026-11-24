import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllowlistCacheState,
  isArrayOutOfBoundsPanic,
  isArrayReadEndError,
  parseInitChainIdValue,
  readSequentiallyUntilEnd,
  withTimeout,
} from './networkAllowlistUtils.js';
import { getNetworkChainConfig } from './networkChainConfig.js';

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
});