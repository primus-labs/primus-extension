import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLIENT_TYPE_NETWORK,
  CLIENT_TYPE_ZKTLS,
  isAllowedClientType,
  isAllowedSdkInboundMessageName,
  isNetworkClientType,
  isPlainPayloadObject,
  isValidSdkInboundPostMessage,
  validateInitBeforeStart,
  validateOwnerSession,
} from '../../../shared/sdkBridgePolicy.js';

describe('sdkBridgePolicy', () => {
  it('isPlainPayloadObject rejects arrays and null', () => {
    assert.equal(isPlainPayloadObject({}), true);
    assert.equal(isPlainPayloadObject([]), false);
    assert.equal(isPlainPayloadObject(null), false);
  });

  it('isAllowedClientType only allows official package names', () => {
    assert.equal(isAllowedClientType(CLIENT_TYPE_ZKTLS), true);
    assert.equal(isAllowedClientType(CLIENT_TYPE_NETWORK), true);
    assert.equal(isAllowedClientType('xxx-network'), false);
  });

  it('isNetworkClientType matches network package only', () => {
    assert.equal(isNetworkClientType(CLIENT_TYPE_NETWORK), true);
    assert.equal(isNetworkClientType(CLIENT_TYPE_ZKTLS), false);
  });

  it('validateOwnerSession requires matching ownerTabId', () => {
    assert.deepEqual(validateOwnerSession({ ownerTabId: 1 }, 1), { ok: true });
    assert.equal(validateOwnerSession({ ownerTabId: 1 }, 2).ok, false);
    assert.equal(validateOwnerSession(null, 1).ok, false);
  });

  it('validateInitBeforeStart requires bridgeInitialized', () => {
    assert.deepEqual(validateInitBeforeStart({ bridgeInitialized: true }), {
      ok: true,
    });
    assert.equal(validateInitBeforeStart({ active: true }).ok, false);
  });

  it('isAllowedSdkInboundMessageName enumerates inbound bridge names', () => {
    assert.equal(isAllowedSdkInboundMessageName('startAttestation'), true);
    assert.equal(isAllowedSdkInboundMessageName('checkIsInstalled'), false);
  });

  it('isValidSdkInboundPostMessage rejects invalid payloads', () => {
    assert.equal(
      isValidSdkInboundPostMessage({ source: {}, data: null }),
      false
    );
    assert.equal(
      isValidSdkInboundPostMessage({
        source: typeof window !== 'undefined' ? window : {},
        data: {
          target: 'padoExtension',
          name: 'notSdkMessage',
          params: {},
        },
      }),
      false
    );
    if (typeof window !== 'undefined') {
      assert.equal(
        isValidSdkInboundPostMessage({
          source: window,
          data: {
            target: 'padoExtension',
            name: 'initAttestation',
            params: { clientType: CLIENT_TYPE_ZKTLS },
          },
        }),
        true
      );
    }
  });
});