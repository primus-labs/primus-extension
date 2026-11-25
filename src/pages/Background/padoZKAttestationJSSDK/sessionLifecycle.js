const LOCK_TAB_ID_KEY = 'padoZKAttestationJSSDKStartAttestationLockTabId';
const LOCK_STARTED_AT_KEY = 'padoZKAttestationJSSDKStartAttestationLockStartedAt';

function parseActiveRequestId(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return typeof raw.requestid === 'string' ? raw.requestid : null;
  }
  try {
    const parsed = JSON.parse(String(raw));
    return typeof parsed?.requestid === 'string' ? parsed.requestid : null;
  } catch (_error) {
    return null;
  }
}

/**
 * Runs cleanup for one proof while preserving the initialized SDK owner.
 * @param {{ clearRuntime: () => Promise<void>; clearPreset: () => Promise<void> }} operations
 */
export async function clearSdkProofLifecycle(operations) {
  await operations.clearRuntime();
  await operations.clearPreset();
}

/**
 * Ends both the active proof and the initialized SDK ownership session.
 * @param {{
 *   clearRuntime: () => Promise<void>;
 *   clearPreset: () => Promise<void>;
 *   clearSession: () => Promise<void>;
 * }} operations
 */
export async function clearSdkFullLifecycle(operations) {
  await clearSdkProofLifecycle(operations);
  await operations.clearSession();
}

let initializationQueue = Promise.resolve();
let proofOwnershipQueue = Promise.resolve();

/**
 * Serializes SDK owner claims in the background service worker.
 * @template T
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
export async function withSdkInitializationLock(operation) {
  const previous = initializationQueue;
  let release;
  initializationQueue = new Promise((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

export async function withSdkProofOwnershipLock(operation) {
  const previous = proofOwnershipQueue;
  let release;
  proofOwnershipQueue = new Promise((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

export async function claimSdkProofOwnership(options) {
  return withSdkProofOwnershipLock(async () => {
    const state = await options.getState();
    const hasActiveProof =
      state?.lockTabId != null || Boolean(state?.activeRequestAttestation);
    const startedAt = Number(state?.lockStartedAt);
    const isStale =
      !Number.isFinite(startedAt) ||
      options.now() - startedAt > options.staleTtlMs;

    if (hasActiveProof && !isStale) return false;
    if (hasActiveProof) await options.clearStale();
    await options.setOwner();
    return true;
  });
}

/**
 * Claims initialization ownership once and keeps same-tab re-init idempotent.
 * @param {{
 *   senderTabId?: number;
 *   getSession: () => Promise<{ ownerTabId?: number } | null>;
 *   setSession: (session: object) => Promise<void>;
 *   createSession: (currentSession: object | null) => object;
 * }} options
 * @returns {Promise<{ claimed: boolean; alreadyOwned: boolean; ownerTabId: number | null }>}
 */
export async function claimSdkInitializationOwner(options) {
  return withSdkInitializationLock(async () => {
    const currentSession = await options.getSession();
    const ownerTabId = currentSession?.ownerTabId ?? null;
    if (options.senderTabId == null) {
      return { claimed: false, alreadyOwned: false, ownerTabId };
    }

    await options.setSession(options.createSession(currentSession));
    return {
      claimed: true,
      alreadyOwned: ownerTabId === options.senderTabId,
      ownerTabId: options.senderTabId,
    };
  });
}

/**
 * @param {unknown} activeRequestId
 * @param {unknown} resultRequestId
 * @returns {boolean}
 */
export function isCurrentProofResult(activeRequestId, resultRequestId) {
  return (
    typeof activeRequestId === 'string' &&
    activeRequestId !== '' &&
    activeRequestId === resultRequestId
  );
}

/**
 * @param {number} tabId
 * @param {{ ownerTabId?: number; sdkVersion?: string; active?: boolean } | null} session
 * @param {Record<string, unknown>} storage
 */
export function buildProofCleanupSnapshot(tabId, session, storage) {
  if (session?.ownerTabId !== tabId) return null;

  const lockTabId = storage?.[LOCK_TAB_ID_KEY];
  const lockStartedAt = storage?.[LOCK_STARTED_AT_KEY];

  return {
    ownerTabId: tabId,
    lockTabId: Number.isInteger(lockTabId) ? lockTabId : null,
    lockStartedAt: Number.isFinite(Number(lockStartedAt))
      ? Number(lockStartedAt)
      : null,
    activeRequestId: parseActiveRequestId(storage?.activeRequestAttestation),
    sdkVersion: session?.sdkVersion || '',
    sessionActive: Boolean(session?.active),
  };
}

/**
 * @param {ReturnType<typeof buildProofCleanupSnapshot>} snapshot
 * @param {ReturnType<typeof buildProofCleanupSnapshot>} current
 * @returns {boolean}
 */
export function isSameProofCleanupSnapshot(snapshot, current) {
  if (!snapshot || !current) return false;
  return (
    snapshot.ownerTabId === current.ownerTabId &&
    snapshot.lockTabId === current.lockTabId &&
    snapshot.lockStartedAt === current.lockStartedAt &&
    snapshot.activeRequestId === current.activeRequestId
  );
}

export function shouldRemoveSdkInitializationForUrl(session, nextUrl) {
  if (!session?.active || !nextUrl) return false;

  try {
    const url = new URL(nextUrl);
    if (session.origin) return url.origin !== session.origin;
    if (session.hostname) return url.hostname !== session.hostname;
    return false;
  } catch (_error) {
    return true;
  }
}
