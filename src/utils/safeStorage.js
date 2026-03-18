/**
 * Safe wrappers for chrome.storage.local to prevent unhandled errors (quota, corruption, etc.).
 * Shared by Background and Content scripts (via @/utils/safeStorage).
 */

export async function safeStorageGet(keys) {
  try {
    return await chrome.storage.local.get(keys);
  } catch (err) {
    console.error('[storage.get] failed for keys:', keys, err);
    return {};
  }
}

export async function safeStorageSet(items) {
  try {
    await chrome.storage.local.set(items);
  } catch (err) {
    console.error('[storage.set] failed:', err);
  }
}

export async function safeStorageRemove(keys) {
  try {
    await chrome.storage.local.remove(keys);
  } catch (err) {
    console.error('[storage.remove] failed for keys:', keys, err);
  }
}
