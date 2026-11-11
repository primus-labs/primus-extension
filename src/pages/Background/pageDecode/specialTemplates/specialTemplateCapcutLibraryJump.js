/**
 * CapCut creation (abf3b33d): jumpConfig may tabs.update to /library/creatives but
 * post-login SPA often lands on /my-edit — retry navigate until URL matches target.
 */
/* global chrome */
import { isCapcutCreationTemplate } from './capcutCreationEmptyEntries/entriesEmpty.js';

const LIBRARY_CREATIVES_PATH = '/library/creatives';

/** @type {number[]} */
const RETRY_DELAY_MS = [700, 1800, 3500];

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {string | undefined} tabUrl
 * @param {string} expectedHref
 * @returns {boolean}
 */
export function isCapcutLibraryJumpTargetUrl(tabUrl, expectedHref) {
  if (typeof tabUrl !== 'string' || !tabUrl || typeof expectedHref !== 'string') {
    return false;
  }
  try {
    const expected = new URL(expectedHref);
    const actual = new URL(tabUrl);
    if (expected.origin !== actual.origin) {
      return false;
    }
    const expPath = expected.pathname.replace(/\/$/, '') || '/';
    const actPath = actual.pathname.replace(/\/$/, '') || '/';
    return actPath === expPath || actPath.startsWith(`${expPath}/`);
  } catch {
    return false;
  }
}

/**
 * Only apply follow-up when this template navigates to CapCut library creatives.
 *
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @param {string} expectedHref
 */
export function shouldUseCapcutLibraryJumpNavigation(activeTemplate, expectedHref) {
  if (!isCapcutCreationTemplate(activeTemplate)) {
    return false;
  }
  try {
    const u = new URL(expectedHref);
    return (
      u.hostname.includes('capcut.com') &&
      u.pathname.includes(LIBRARY_CREATIVES_PATH)
    );
  } catch {
    return false;
  }
}

/**
 * @param {number} tabId
 * @param {string} expectedHref
 * @returns {Promise<boolean>}
 */
export async function applyCapcutLibraryJumpNavigation(tabId, expectedHref) {
  const href = expectedHref.trim();
  await chrome.tabs.update(tabId, { url: href });

  for (const waitMs of RETRY_DELAY_MS) {
    await delay(waitMs);
    let tab;
    try {
      tab = await chrome.tabs.get(tabId);
    } catch {
      return true;
    }
    const currentUrl = tab?.url || '';
    if (isCapcutLibraryJumpTargetUrl(currentUrl, href)) {
      return true;
    }
    try {
      await chrome.tabs.update(tabId, { url: href });
    } catch {
      return true;
    }
  }
  return true;
}
