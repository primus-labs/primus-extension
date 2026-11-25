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
    if (ownerTabId != null && ownerTabId !== options.senderTabId) {
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
