/**
 * In-memory mutex for short SDK session/start-lock read-modify-write sections.
 * Chrome runs one background service worker instance, so one queue protects all
 * overlapping init/start message handlers without holding network work.
 */
let ownershipQueue = Promise.resolve();

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
export async function withSdkSessionOwnershipLock(operation) {
  const previous = ownershipQueue;
  let release;
  ownershipQueue = new Promise((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

/**
 * @param {number | null | undefined} lockTabId
 * @param {number | null | undefined} senderTabId
 * @returns {boolean}
 */
export function canInitClaimSession(lockTabId, senderTabId) {
  if (lockTabId == null) return true;
  return senderTabId != null && lockTabId === senderTabId;
}

/**
 * @param {{
 *   lockTabId?: number | null;
 *   lockStartedAt?: unknown;
 *   hasActiveRequest?: boolean;
 *   hasSessionVersion?: boolean;
 *   now: number;
 *   staleTtlMs: number;
 * }} state
 * @returns {'acquire' | 'clear-and-acquire' | 'busy'}
 */
export function getStartSessionClaimAction(state) {
  const startedAt = Number(state.lockStartedAt);
  const hasValidStartedAt = Number.isFinite(startedAt);
  const isStaleByTime =
    !hasValidStartedAt || state.now - startedAt > state.staleTtlMs;

  if (state.lockTabId != null) {
    return isStaleByTime ? 'clear-and-acquire' : 'busy';
  }
  if (state.hasActiveRequest) {
    return !state.hasSessionVersion || isStaleByTime
      ? 'clear-and-acquire'
      : 'busy';
  }
  return 'acquire';
}
