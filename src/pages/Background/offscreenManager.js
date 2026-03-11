/**
 * Offscreen document lifecycle: check existence, create, close. Used by algorithm flow.
 */
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

/**
 * Check if the offscreen document with the given path is already open.
 * @param {string} [path] - Path to offscreen document (default: offscreen.html)
 * @returns {Promise<boolean>}
 */
export async function hasOffscreenDocument(path = OFFSCREEN_DOCUMENT_PATH) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const matchedClients = await clients.matchAll();
  for (const client of matchedClients) {
    if (client.url === offscreenUrl) {
      return true;
    }
  }
  return false;
}

/**
 * Create the offscreen document if it does not already exist.
 * @returns {Promise<void>}
 */
export async function createOffscreenDoc() {
  if (await hasOffscreenDocument()) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
    reasons: ['IFRAME_SCRIPTING'],
    justification: 'WORKERS for needing the document',
  });
}

/**
 * Close the offscreen document.
 * @returns {Promise<void>}
 */
export async function closeOffscreenDoc() {
  await chrome.offscreen.closeDocument();
}
