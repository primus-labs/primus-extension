import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldInjectPageDecodeOnTabUpdate,
  PAGE_DECODE_BOOT_GLOBAL,
} from './pageDecodeInject.js';

describe('pageDecodeInject', () => {
  it('exports boot global key', () => {
    assert.equal(PAGE_DECODE_BOOT_GLOBAL, '__PADO_PAGE_DECODE_BOOTED__');
  });

  it('shouldInjectPageDecodeOnTabUpdate only on document complete', () => {
    assert.equal(shouldInjectPageDecodeOnTabUpdate(null), false);
    assert.equal(shouldInjectPageDecodeOnTabUpdate({ title: 'Google Account' }), false);
    assert.equal(
      shouldInjectPageDecodeOnTabUpdate({ url: 'https://myaccount.google.com/' }),
      false
    );
    assert.equal(
      shouldInjectPageDecodeOnTabUpdate({
        url: 'https://myaccount.google.com/',
        status: 'complete',
      }),
      true
    );
    assert.equal(shouldInjectPageDecodeOnTabUpdate({ status: 'complete' }), true);
    assert.equal(shouldInjectPageDecodeOnTabUpdate({ status: 'loading' }), false);
  });
});
