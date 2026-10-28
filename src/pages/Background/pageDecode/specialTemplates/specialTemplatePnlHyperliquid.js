/* global chrome, console, clearTimeout, setTimeout */
import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = '801a0cae-c21d-4063-91c6-fb58687c9d30';
export const displayName = 'Hyperliquid';

const RELOAD_DELAY_MS = 200;
const TAB_COMPLETE_WAIT_MS = 30000;

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
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

export const hooks = {
  pageDecodeModal: { darkTheme: true, placement: 'center' },
  jsonPath: { truncateAtEmptyArray: true },
};

/**
 * @param {number | null | undefined} tabId
 * @returns {Promise<void>}
 */
export async function reloadDataSourceTabAfterOpen(tabId) {
  if (tabId == null) return;
  try {
    await waitForTabLoadComplete(tabId);
    await delay(RELOAD_DELAY_MS);
    await chrome.tabs.reload(tabId);
    await waitForTabLoadComplete(tabId);
    console.log('hyperliquidPnl: data source tab reload after initial load', tabId);
  } catch (e) {
    console.warn('hyperliquidPnl: data source tab reload failed', e);
  }
}
