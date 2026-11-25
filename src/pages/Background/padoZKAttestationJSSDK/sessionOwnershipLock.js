/**
 * In-memory mutex for short SDK session/start-lock read-modify-write sections.
 * Shares the proof-ownership queue so request-id cleanup and proof claims
 * cannot interleave.
 */
import { withSdkProofOwnershipLock } from './sessionLifecycle.js';

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
export async function withSdkSessionOwnershipLock(operation) {
  return withSdkProofOwnershipLock(operation);
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
 * @param {{ ownerTabId?: number; startedAt?: number; requestId?: string }} claim
 * @param {{ ownerTabId?: number; startedAt?: unknown; requestId?: unknown }} stored
 * @returns {boolean}
 */
export function isCurrentStartSessionClaim(claim, stored) {
  return (
    claim?.ownerTabId != null &&
    claim.ownerTabId === stored?.ownerTabId &&
    Number.isFinite(claim.startedAt) &&
    claim.startedAt === Number(stored?.startedAt) &&
    typeof claim.requestId === 'string' &&
    claim.requestId !== '' &&
    claim.requestId === stored?.requestId
  );
}

/**
 * @param {unknown} currentRequestId
 * @param {unknown} messageRequestId
 * @returns {boolean}
 */
export function isCurrentRequestId(currentRequestId, messageRequestId) {
  return (
    typeof currentRequestId === 'string' &&
    currentRequestId !== '' &&
    currentRequestId === messageRequestId
  );
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
