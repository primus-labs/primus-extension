/**
 * Dev console message router: init (create tab, capture requests), closeDataSource, FAVICON_URL.
 */
import { getDevconsoleState, resetDevconsoleState } from './state';
import { setupRequestCapture, removeRequestCapture } from './requestCapture';
import {
  createDataSourceTab,
  closeDataSourceTab,
  setupTabListeners,
} from './tabManager';

const DEVCONSOLE_ALLOWED_PREFIXES = ['https://dev.primuslabs.xyz/'];
const DEVCONSOLE_DEV_ALLOWED_PREFIXES = [
  'http://localhost/',
  'http://api-dev.padolabs.org:38082/',
  'http://api-dev.padolabs.org:38089/',
  'http://35.200.124.249/',
];

function getAllowedDevconsolePrefixes() {
  if (process.env.NODE_ENV === 'development') {
    return [
      ...DEVCONSOLE_ALLOWED_PREFIXES,
      ...DEVCONSOLE_DEV_ALLOWED_PREFIXES,
    ];
  }
  return DEVCONSOLE_ALLOWED_PREFIXES;
}

function isAllowedDevconsoleUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  return getAllowedDevconsolePrefixes().some((prefix) => url.startsWith(prefix));
}

function isMessageFromDevconsolePage(name, sender, state) {
  if (!sender?.tab?.id || !sender?.tab?.url) return false;
  if (!['init', 'closeDataSource'].includes(name)) return false;
  if (state.devconsoleTabId && sender.tab.id !== state.devconsoleTabId) {
    return false;
  }
  return isAllowedDevconsoleUrl(sender.tab.url);
}

function isMessageFromDataSourcePage(name, sender, state) {
  if (name !== 'FAVICON_URL') return false;
  return sender?.tab?.id === state.checkDataSourcePageTabId;
}

export async function devconsoleMsgListener(request, sender, sendResponse) {
  try {
    const { name, params } = request;
    const state = getDevconsoleState();

    if (
      !isMessageFromDevconsolePage(name, sender, state) &&
      !isMessageFromDataSourcePage(name, sender, state)
    ) {
      console.warn('devconsoleMsgListener blocked unexpected sender', {
        name,
        tabId: sender?.tab?.id,
        url: sender?.tab?.url,
      });
      return;
    }

    if (name === 'init') {
      resetDevconsoleState();
      state.devconsoleTabId = sender.tab?.id;

      removeRequestCapture();

      await createDataSourceTab(params.expectedUrl);
      setupRequestCapture();
      setupTabListeners();
    } else if (name === 'FAVICON_URL') {
      if (state.devconsoleTabId) {
        chrome.tabs.sendMessage(state.devconsoleTabId, {
          type: 'devconsole',
          name: 'FAVICON_URL',
          params,
        });
      }
    } else if (name === 'closeDataSource') {
      console.log('debuge-zktls-closeDataSource-bg', state.checkDataSourcePageTabId);
      await closeDataSourceTab(state.checkDataSourcePageTabId);
    }
  } catch (e) {
    console.error('devconsoleMsgListener', e);
  } finally {
    try {
      sendResponse?.({});
    } catch (_e) {
      // Channel already closed or response already sent
    }
  }
}
