/**
 * LinkedIn profile template (a87deb8c): jumpConfig assembles profile URL →
 * chrome.tabs.update → wait for /in/ page complete → hard reload (scheme B)
 * so webRequest captures main_frame with ?isSelfProfile=true.
 */
/* global chrome, console */
import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = 'a87deb8c-32c7-41c7-ac69-60bad0e35a38';
export const displayName = 'LinkedIn profile jump';

const TAB_COMPLETE_WAIT_MS = 30000;
const RELOAD_DELAY_MS = 200;
const LINKEDIN_PROFILE_URL_RE = /linkedin\.com\/in\//i;

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
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

/**
 * @param {number} tabId
 * @param {number} [timeoutMs]
 * @returns {Promise<void>}
 */
function waitForTabLoadComplete(tabId, timeoutMs = TAB_COMPLETE_WAIT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timeoutId);
      resolve();
    };

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.status === 'complete') {
        finish();
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);

    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab?.status === 'complete') {
          finish();
        }
      })
      .catch(() => {
        finish();
      });

    const timeoutId = setTimeout(finish, timeoutMs);
  });
}

/**
 * Wait until tab URL looks like a LinkedIn profile (or timeout).
 *
 * @param {number} tabId
 * @param {number} [timeoutMs]
 * @returns {Promise<void>}
 */
function waitForLinkedInProfileTabUrl(tabId, timeoutMs = TAB_COMPLETE_WAIT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timeoutId);
      resolve();
    };

    const urlMatches = (url) =>
      typeof url === 'string' && LINKEDIN_PROFILE_URL_RE.test(url);

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.url && urlMatches(changeInfo.url)) {
        finish();
        return;
      }
      if (changeInfo.status === 'complete') {
        chrome.tabs.get(tabId).then((tab) => {
          if (urlMatches(tab?.url)) {
            finish();
          }
        }).catch(() => {});
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);

    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (urlMatches(tab?.url)) {
          finish();
        }
      })
      .catch(() => {
        finish();
      });

    const timeoutId = setTimeout(finish, timeoutMs);
  });
}

/**
 * @param {number} tabId
 * @param {string} href
 */
async function locationHrefInTab(tabId, href) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (url) => {
      window.location.href = url;
    },
    args: [href],
  });
}

/**
 * Scheme B: tabs.update → profile URL ready → ensure query if needed → reload.
 *
 * @param {number} tabId
 * @param {string} href
 */
async function linkedInTabsUpdateThenHardReload(tabId, href) {
  await chrome.tabs.update(tabId, { url: href });
  await waitForLinkedInProfileTabUrl(tabId);
  await waitForTabLoadComplete(tabId);

  const tab = await chrome.tabs.get(tabId);
  const currentUrl = tab?.url || '';
  if (
    href.includes('isSelfProfile=true') &&
    !currentUrl.includes('isSelfProfile=true')
  ) {
    await locationHrefInTab(tabId, href);
    await waitForTabLoadComplete(tabId);
  }

  await delay(RELOAD_DELAY_MS);
  await chrome.tabs.reload(tabId);
  console.log('linkedinProfileJump: tabs.update + hard reload', href);
}

/**
 * Apply jumpConfig redirect for the data-source tab.
 *
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @param {number | null | undefined} tabId
 * @param {string} newUrl
 * @param {{ linkedInFollowUpNav?: boolean } | null | undefined} [options]
 * @returns {Promise<boolean>} false if tabId/url invalid
 */
export async function applyJumpConfigDataSourceNavigation(
  activeTemplate,
  tabId,
  newUrl,
  options = null
) {
  if (tabId == null || typeof newUrl !== 'string' || !newUrl.trim()) {
    return false;
  }
  const href = newUrl.trim();
  const useLinkedInFollowUpNav =
    options?.linkedInFollowUpNav !== false && matches(activeTemplate);

  if (useLinkedInFollowUpNav) {
    try {
      await linkedInTabsUpdateThenHardReload(tabId, href);
      return true;
    } catch (e) {
      console.warn('linkedinProfileJump: tabs.update + hard reload failed', e);
      return false;
    }
  }

  await chrome.tabs.update(tabId, { url: href });
  return true;
}
