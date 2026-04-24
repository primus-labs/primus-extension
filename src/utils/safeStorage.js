/**
 * Safe wrappers for extension storage to prevent unhandled errors (quota, corruption, etc.).
 * Shared by Background and Content scripts (via @/utils/safeStorage).
 *
 * Attestation runtime locks live in session storage so they do not survive an extension reload
 * or browser restart, while the rest of the state remains in local storage.
 */

const SESSION_STORAGE_KEYS = new Set([
  'activeRequestAttestation',
  'activeRequestAttestationStartedAt',
]);

function hasSessionStorageArea() {
  return !!chrome.storage.session;
}

function getSessionStorageArea() {
  return chrome.storage.session || chrome.storage.local;
}

function getRequestedKeyNames(keys) {
  if (Array.isArray(keys)) return keys;
  if (typeof keys === 'string') return [keys];
  if (keys && typeof keys === 'object') return Object.keys(keys);
  return [];
}

function buildStorageArg(keys, keyNames) {
  if (Array.isArray(keys)) return keyNames;
  if (typeof keys === 'string') return keyNames[0] || keys;
  if (keys && typeof keys === 'object') {
    return keyNames.reduce((acc, key) => {
      acc[key] = keys[key];
      return acc;
    }, {});
  }
  return keyNames;
}

function splitKeyNames(keyNames) {
  return keyNames.reduce(
    (acc, key) => {
      if (SESSION_STORAGE_KEYS.has(key)) acc.sessionKeys.push(key);
      else acc.localKeys.push(key);
      return acc;
    },
    { sessionKeys: [], localKeys: [] }
  );
}

export async function safeStorageGet(keys) {
  const requestedKeyNames = getRequestedKeyNames(keys);
  const { sessionKeys, localKeys } = splitKeyNames(requestedKeyNames);
  try {
    const [localItems, sessionItems] = await Promise.all([
      localKeys.length
        ? chrome.storage.local.get(buildStorageArg(keys, localKeys))
        : Promise.resolve({}),
      sessionKeys.length
        ? getSessionStorageArea().get(buildStorageArg(keys, sessionKeys))
        : Promise.resolve({}),
    ]);
    return { ...localItems, ...sessionItems };
  } catch (err) {
    console.error('[storage.get] failed for keys:', keys, err);
    return {};
  }
}

export async function safeStorageSet(items) {
  const entries = Object.entries(items || {});
  const sessionItems = {};
  const localItems = {};

  entries.forEach(([key, value]) => {
    if (SESSION_STORAGE_KEYS.has(key)) {
      sessionItems[key] = value;
    } else {
      localItems[key] = value;
    }
  });

  try {
    await Promise.all([
      Object.keys(localItems).length
        ? chrome.storage.local.set(localItems)
        : Promise.resolve(),
      Object.keys(sessionItems).length
        ? Promise.all([
            getSessionStorageArea().set(sessionItems),
            hasSessionStorageArea()
              ? chrome.storage.local.remove(Object.keys(sessionItems))
              : Promise.resolve(),
          ])
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error('[storage.set] failed:', err);
  }
}

export async function safeStorageRemove(keys) {
  const requestedKeyNames = getRequestedKeyNames(keys);
  const { sessionKeys, localKeys } = splitKeyNames(requestedKeyNames);
  try {
    await Promise.all([
      requestedKeyNames.length
        ? chrome.storage.local.remove([...new Set([...localKeys, ...sessionKeys])])
        : Promise.resolve(),
      sessionKeys.length
        ? getSessionStorageArea().remove(sessionKeys)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error('[storage.remove] failed for keys:', keys, err);
  }
}
