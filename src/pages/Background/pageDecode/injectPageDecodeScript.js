/* global chrome */
/**
 * Inject pageDecode content script + CSS into the data-source tab (once per document when possible).
 */
import { PAGE_DECODE_BOOT_GLOBAL } from './pageDecodeInject.js';

/**
 * @param {number} tabId
 * @returns {Promise<boolean>}
 */
export async function isPageDecodeBootedInTab(tabId) {
  if (tabId == null) {
    return false;
  }
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (bootKey) => Boolean(globalThis[bootKey]),
      args: [PAGE_DECODE_BOOT_GLOBAL],
    });
    return !!result;
  } catch {
    return false;
  }
}

/**
 * @param {number} tabId
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<boolean>} true if bundle was injected
 */
export async function injectPageDecodeIntoTab(tabId, options = {}) {
  if (tabId == null) {
    return false;
  }
  const { force = false } = options;
  if (!force && (await isPageDecodeBootedInTab(tabId))) {
    return false;
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['pageDecode.bundle.js'],
  });
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ['static/css/pageDecode.css'],
  });
  return true;
}
