import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canInitClaimSession,
  getStartSessionClaimAction,
  isCurrentRequestId,
  isCurrentStartSessionClaim,
  withSdkSessionOwnershipLock,
} from './sessionOwnershipLock.js';

describe('sessionOwnershipLock', () => {
  it('serializes overlapping ownership updates', async () => {
    const events = [];
    let releaseFirst;
    const firstGate = new Promise((resolve) => {
      releaseFirst = resolve;
    });

    const first = withSdkSessionOwnershipLock(async () => {
      events.push('first-enter');
      await firstGate;
      events.push('first-exit');
    });
    const second = withSdkSessionOwnershipLock(async () => {
      events.push('second-enter');
    });

    await Promise.resolve();
    assert.deepEqual(events, ['first-enter']);
    releaseFirst();
    await Promise.all([first, second]);
    assert.deepEqual(events, [
      'first-enter',
      'first-exit',
      'second-enter',
    ]);
  });

  it('prevents another tab init from taking an active start owner', () => {
    assert.equal(canInitClaimSession(10, 20), false);
    assert.equal(canInitClaimSession(10, 10), true);
    assert.equal(canInitClaimSession(10, null), false);
    assert.equal(canInitClaimSession(null, 20), true);
  });

  it('accepts algorithm messages only for the current request', () => {
    assert.equal(isCurrentRequestId('current', 'current'), true);
    assert.equal(isCurrentRequestId('current', 'old'), false);
    assert.equal(isCurrentRequestId('current', undefined), false);
    assert.equal(isCurrentRequestId('', ''), false);
  });

  it('clears only the request that still owns the start lock', async () => {
    const oldClaim = { ownerTabId: 10, startedAt: 100, requestId: 'old' };
    const newClaim = { ownerTabId: 10, startedAt: 100, requestId: 'new' };
    let storedClaim = newClaim;

    await withSdkSessionOwnershipLock(async () => {
      if (isCurrentStartSessionClaim(oldClaim, storedClaim)) {
        storedClaim = null;
      }
    });
    assert.deepEqual(storedClaim, newClaim);

    await withSdkSessionOwnershipLock(async () => {
      if (isCurrentStartSessionClaim(newClaim, storedClaim)) {
        storedClaim = null;
      }
    });
    assert.equal(storedClaim, null);
  });

  it('serializes cleanup before a newer claim is written', async () => {
    const oldClaim = { ownerTabId: 10, startedAt: 100, requestId: 'old' };
    const newClaim = { ownerTabId: 20, startedAt: 200, requestId: 'new' };
    let storedClaim = oldClaim;
    let releaseCleanup;
    const cleanupGate = new Promise((resolve) => {
      releaseCleanup = resolve;
    });

    const cleanup = withSdkSessionOwnershipLock(async () => {
      await cleanupGate;
      if (isCurrentStartSessionClaim(oldClaim, storedClaim)) {
        storedClaim = null;
      }
    });
    const claim = withSdkSessionOwnershipLock(async () => {
      storedClaim = newClaim;
    });

    releaseCleanup();
    await Promise.all([cleanup, claim]);
    assert.deepEqual(storedClaim, newClaim);
  });

  it('keeps a fresh start busy and allows stale state takeover', () => {
    assert.equal(
      getStartSessionClaimAction({
        lockTabId: 10,
        lockStartedAt: 900,
        now: 1000,
        staleTtlMs: 200,
      }),
      'busy'
    );
    assert.equal(
      getStartSessionClaimAction({
        lockTabId: 10,
        lockStartedAt: 700,
        now: 1000,
        staleTtlMs: 200,
      }),
      'clear-and-acquire'
    );
    assert.equal(
      getStartSessionClaimAction({
        hasActiveRequest: true,
        hasSessionVersion: false,
        now: 1000,
        staleTtlMs: 200,
      }),
      'clear-and-acquire'
    );
  });
});
