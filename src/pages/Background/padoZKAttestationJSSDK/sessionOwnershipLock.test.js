import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canInitClaimSession,
  getStartSessionClaimAction,
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
