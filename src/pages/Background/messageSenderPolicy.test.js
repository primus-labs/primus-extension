import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBackgroundRouteKey,
  isAlgorithmResponseFromOffscreen,
  isSdkMessageFromOwner,
  isTrustedPageDecodeRuntimeSender,
} from './messageSenderPolicy.js';

const RUNTIME_ID = 'extension-id';
const OFFSCREEN_URL = `chrome-extension://${RUNTIME_ID}/offscreen.html`;

describe('background message sender policy', () => {
  it('accepts algorithm responses only from the offscreen document', () => {
    const message = { resType: 'algorithm', resMethodName: 'start' };
    assert.equal(
      isAlgorithmResponseFromOffscreen(
        message,
        { id: RUNTIME_ID, url: OFFSCREEN_URL },
        RUNTIME_ID,
        OFFSCREEN_URL
      ),
      true
    );
    assert.equal(
      isAlgorithmResponseFromOffscreen(
        message,
        { id: RUNTIME_ID, url: 'https://example.com/' },
        RUNTIME_ID,
        OFFSCREEN_URL
      ),
      false
    );
    assert.equal(
      isAlgorithmResponseFromOffscreen(
        message,
        { id: 'other-extension', url: OFFSCREEN_URL },
        RUNTIME_ID,
        OFFSCREEN_URL
      ),
      false
    );
  });

  it('accepts pageDecode messages from the active data-source tab', () => {
    assert.equal(
      isTrustedPageDecodeRuntimeSender(
        { id: RUNTIME_ID, tab: { id: 12 } },
        12,
        RUNTIME_ID
      ),
      true
    );
    assert.equal(
      isTrustedPageDecodeRuntimeSender(
        { id: RUNTIME_ID, tab: { id: 13 } },
        12,
        RUNTIME_ID
      ),
      false
    );
    assert.equal(
      isTrustedPageDecodeRuntimeSender(
        { id: 'other-extension', tab: { id: 12 } },
        12,
        RUNTIME_ID
      ),
      false
    );
    assert.equal(
      isTrustedPageDecodeRuntimeSender({ id: RUNTIME_ID }, 12, RUNTIME_ID),
      true
    );
  });

  it('binds SDK controls to owner while allowing init to establish it', () => {
    assert.equal(isSdkMessageFromOwner('initAttestation', 20, null), true);
    assert.equal(isSdkMessageFromOwner('startAttestation', 20, 20), true);
    assert.equal(isSdkMessageFromOwner('startAttestation', 21, 20), false);
    assert.equal(isSdkMessageFromOwner('removeActiveAttestation', null, 20), false);
  });

  it('does not route algorithm commands as background responses', () => {
    assert.equal(
      getBackgroundRouteKey({ type: 'algorithm', method: 'init' }),
      null
    );
    assert.equal(
      getBackgroundRouteKey({
        resType: 'algorithm',
        resMethodName: 'start',
      }),
      'algorithm'
    );
    assert.equal(
      getBackgroundRouteKey({ type: 'pageDecode', name: 'start' }),
      'pageDecode'
    );
  });
});
