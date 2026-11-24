import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseInitChainIdValue, withTimeout } from './networkAllowlistUtils.js';

const SUPPORTED = new Set([84532, 8453, 133, 177]);
const isSupported = (id) => SUPPORTED.has(id);

describe('networkAllowlistRefresh', () => {
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
});