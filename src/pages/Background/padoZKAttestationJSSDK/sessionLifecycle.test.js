import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSdkMessageFromOwner } from '../messageSenderPolicy.js';
const LOCK_TAB_ID_KEY = 'padoZKAttestationJSSDKStartAttestationLockTabId';
const LOCK_STARTED_AT_KEY =
  'padoZKAttestationJSSDKStartAttestationLockStartedAt';

import {
  buildProofCleanupSnapshot,
  claimSdkProofOwnership,
  claimSdkInitializationOwner,
  clearSdkFullLifecycle,
  clearSdkProofLifecycle,
  isCurrentProofResult,
  isSameProofCleanupSnapshot,
  shouldRemoveSdkInitializationForUrl,
  withSdkProofOwnershipLock,
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

  it('allows tab B to initialize and start after tab A proof cleanup', async () => {
    const initializedSessions = new Map([
      [20, { ownerTabId: 20 }],
      [21, { ownerTabId: 21 }],
    ]);
    let activeOwnerTabId = 20;
    const operations = {
      clearRuntime: async () => {
        activeOwnerTabId = null;
      },
      clearPreset: async () => {},
      clearSession: async () => initializedSessions.clear(),
    };

    await clearSdkProofLifecycle(operations);
    assert.equal(
      isSdkMessageFromOwner(
        'initAttestation',
        21,
        initializedSessions.get(21)?.ownerTabId,
        activeOwnerTabId
      ),
      true
    );
    assert.equal(
      isSdkMessageFromOwner(
        'startAttestation',
        21,
        initializedSessions.get(21)?.ownerTabId,
        activeOwnerTabId
      ),
      true
    );

    await clearSdkFullLifecycle(operations);
    assert.equal(
      isSdkMessageFromOwner(
        'startAttestation',
        20,
        initializedSessions.get(20)?.ownerTabId
      ),
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

  it('retains independent initialization sessions for multiple tabs', async () => {
    const sessions = new Map([[20, { ownerTabId: 20 }]]);
    const result = await claimSdkInitializationOwner({
      senderTabId: 21,
      getSession: async () => sessions.get(21) || null,
      setSession: async (next) => {
        sessions.set(21, next);
      },
      createSession: () => ({ ownerTabId: 21 }),
    });

    assert.equal(result.claimed, true);
    assert.equal(result.ownerTabId, 21);
    assert.equal(sessions.get(20).ownerTabId, 20);
    assert.equal(sessions.get(21).ownerTabId, 21);
  });

  it('serializes concurrent per-tab initialization claims without dropping either tab', async () => {
    const sessions = new Map();
    const claim = (senderTabId) =>
      claimSdkInitializationOwner({
        senderTabId,
        getSession: async () => sessions.get(senderTabId) || null,
        setSession: async (next) => {
          await Promise.resolve();
          sessions.set(senderTabId, next);
        },
        createSession: () => ({ ownerTabId: senderTabId }),
      });

    const results = await Promise.all([claim(20), claim(21)]);
    assert.equal(results.filter((result) => result.claimed).length, 2);
    assert.equal(sessions.get(20).ownerTabId, 20);
    assert.equal(sessions.get(21).ownerTabId, 21);
  });

  it('ignores a previous proof result after the next proof starts', () => {
    assert.equal(isCurrentProofResult('proof-2', 'proof-1'), false);
    assert.equal(isCurrentProofResult('proof-2', 'proof-2'), true);
    assert.equal(isCurrentProofResult('', ''), false);
  });

  it('removes only a tab that navigates away from its initialized origin', () => {
    const session = {
      active: true,
      origin: 'https://app.example.com',
      hostname: 'app.example.com',
    };
    assert.equal(
      shouldRemoveSdkInitializationForUrl(
        session,
        'https://app.example.com/next'
      ),
      false
    );
    assert.equal(
      shouldRemoveSdkInitializationForUrl(
        session,
        'https://other.example.com/'
      ),
      true
    );
  });

  it('serializes proof cleanup and the next proof claim', async () => {
    const events = [];
    await Promise.all([
      withSdkProofOwnershipLock(async () => {
        events.push('cleanup-start');
        await Promise.resolve();
        events.push('cleanup-end');
      }),
      withSdkProofOwnershipLock(async () => {
        events.push('claim');
      }),
    ]);
    assert.deepEqual(events, ['cleanup-start', 'cleanup-end', 'claim']);
  });

  it('aborts stale tab cleanup when another tab owns the active proof', () => {
    const tabA = 20;
    const tabB = 21;
    const snapshotA = buildProofCleanupSnapshot(
      tabA,
      { ownerTabId: tabA, sdkVersion: '1.0', active: true },
      {
        [LOCK_TAB_ID_KEY]: tabA,
        [LOCK_STARTED_AT_KEY]: 100,
        activeRequestAttestation: JSON.stringify({ requestid: 'proof-a' }),
      }
    );
    const currentAfterBClaims = buildProofCleanupSnapshot(
      tabA,
      { ownerTabId: tabB, sdkVersion: '1.0', active: true },
      {
        [LOCK_TAB_ID_KEY]: tabB,
        [LOCK_STARTED_AT_KEY]: 200,
        activeRequestAttestation: JSON.stringify({ requestid: 'proof-b' }),
      }
    );

    assert.equal(isSameProofCleanupSnapshot(snapshotA, currentAfterBClaims), false);
  });

  it('allows tab cleanup when proof generation is unchanged', () => {
    const tabId = 20;
    const session = { ownerTabId: tabId, sdkVersion: '1.0', active: true };
    const storage = {
      [LOCK_TAB_ID_KEY]: tabId,
      [LOCK_STARTED_AT_KEY]: 100,
      activeRequestAttestation: JSON.stringify({ requestid: 'proof-a' }),
    };
    const snapshot = buildProofCleanupSnapshot(tabId, session, storage);
    const current = buildProofCleanupSnapshot(tabId, session, storage);

    assert.equal(isSameProofCleanupSnapshot(snapshot, current), true);
  });

  it('rejects finalize after tab A proof was cleared but tab B now owns', () => {
    const tabA = 20;
    const snapshotA = buildProofCleanupSnapshot(
      tabA,
      { ownerTabId: tabA, sdkVersion: '1.0', active: true },
      {
        [LOCK_TAB_ID_KEY]: tabA,
        [LOCK_STARTED_AT_KEY]: 100,
        activeRequestAttestation: JSON.stringify({ requestid: 'proof-a' }),
      }
    );
    const afterCancel = buildProofCleanupSnapshot(tabA, null, {});
    assert.equal(isSameProofCleanupSnapshot(snapshotA, afterCancel), false);
  });

  it('lets initialized tabs alternate proofs while keeping one active owner', async () => {
    let activeProof = null;
    const claim = (tabId) =>
      claimSdkProofOwnership({
        getState: async () => ({
          lockTabId: activeProof?.tabId,
          lockStartedAt: activeProof?.startedAt,
        }),
        clearStale: async () => {
          activeProof = null;
        },
        setOwner: async () => {
          activeProof = { tabId, startedAt: 100 };
        },
        now: () => 101,
        staleTtlMs: 1_000,
      });
    const complete = () =>
      withSdkProofOwnershipLock(async () => {
        activeProof = null;
      });

    assert.equal(await claim(20), true);
    assert.equal(await claim(21), false);
    await complete();
    assert.equal(await claim(21), true);
    await complete();
    assert.equal(await claim(20), true);
  });
});
