import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSdkMessageFromOwner } from '../messageSenderPolicy.js';
import {
  claimSdkInitializationOwner,
  clearSdkFullLifecycle,
  clearSdkProofLifecycle,
  isCurrentProofResult,
} from './sessionLifecycle.js';

describe('SDK session lifecycle', () => {
  it('supports two proofs after one initialization', async () => {
    let session = { ownerTabId: 20 };
    let runtimeActive = true;
    let presetActive = true;
    const operations = {
      clearRuntime: async () => {
        runtimeActive = false;
      },
      clearPreset: async () => {
        presetActive = false;
      },
      clearSession: async () => {
        session = null;
      },
    };

    assert.equal(
      isSdkMessageFromOwner('startAttestation', 20, session?.ownerTabId),
      true
    );
    await clearSdkProofLifecycle(operations);
    assert.equal(runtimeActive, false);
    assert.equal(presetActive, false);
    assert.equal(session?.ownerTabId, 20);

    runtimeActive = true;
    presetActive = true;
    assert.equal(
      isSdkMessageFromOwner('startAttestation', 20, session?.ownerTabId),
      true
    );
    await clearSdkProofLifecycle(operations);
    assert.equal(runtimeActive, false);
    assert.equal(presetActive, false);
    assert.equal(session?.ownerTabId, 20);
  });

  it('keeps other tabs blocked until the initialized session ends', async () => {
    let session = { ownerTabId: 20 };
    const operations = {
      clearRuntime: async () => {},
      clearPreset: async () => {},
      clearSession: async () => {
        session = null;
      },
    };

    await clearSdkProofLifecycle(operations);
    assert.equal(
      isSdkMessageFromOwner('initAttestation', 21, session?.ownerTabId),
      false
    );
    assert.equal(
      isSdkMessageFromOwner('startAttestation', 21, session?.ownerTabId),
      false
    );

    await clearSdkFullLifecycle(operations);
    assert.equal(
      isSdkMessageFromOwner('startAttestation', 20, session?.ownerTabId),
      false
    );
  });

  it('keeps same-tab re-initialization idempotent', async () => {
    let session = { ownerTabId: 20, sdkVersion: '1' };
    const result = await claimSdkInitializationOwner({
      senderTabId: 20,
      getSession: async () => session,
      setSession: async (next) => {
        session = next;
      },
      createSession: () => ({ ownerTabId: 20, sdkVersion: '2' }),
    });

    assert.deepEqual(result, {
      claimed: true,
      alreadyOwned: true,
      ownerTabId: 20,
    });
    assert.equal(session.sdkVersion, '2');
  });

  it('rejects another tab between proofs', async () => {
    let session = { ownerTabId: 20 };
    const result = await claimSdkInitializationOwner({
      senderTabId: 21,
      getSession: async () => session,
      setSession: async (next) => {
        session = next;
      },
      createSession: () => ({ ownerTabId: 21 }),
    });

    assert.equal(result.claimed, false);
    assert.equal(result.ownerTabId, 20);
    assert.equal(session.ownerTabId, 20);
  });

  it('allows only one concurrent first owner claim', async () => {
    let session = null;
    const claim = (senderTabId) =>
      claimSdkInitializationOwner({
        senderTabId,
        getSession: async () => session,
        setSession: async (next) => {
          await Promise.resolve();
          session = next;
        },
        createSession: () => ({ ownerTabId: senderTabId }),
      });

    const results = await Promise.all([claim(20), claim(21)]);
    assert.equal(results.filter((result) => result.claimed).length, 1);
    assert.equal(session.ownerTabId, 20);
  });

  it('ignores a previous proof result after the next proof starts', () => {
    assert.equal(isCurrentProofResult('proof-2', 'proof-1'), false);
    assert.equal(isCurrentProofResult('proof-2', 'proof-2'), true);
    assert.equal(isCurrentProofResult('', ''), false);
  });
});
