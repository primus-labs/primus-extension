/**
 * Dev console tab lifecycle: create data source tab, inject scripts, handle tab update/removed.
 */
import { getDevconsoleState } from './state';
import { removeRequestCapture } from './requestCapture';

function sendMsgToDevconsole(msg) {
  const state = getDevconsoleState();
  if (state.devconsoleTabId) {
    chrome.tabs.sendMessage(state.devconsoleTabId, msg);
  }
}

/**
 * Create a hidden tab for the data source URL. Sets state and sends visitedPagePaths.
 */
export async function createDataSourceTab(expectedUrl) {
  const state = getDevconsoleState();
  const tab = await chrome.tabs.create({
    url: expectedUrl,
    active: false,
  });
  state.checkDataSourcePageTabId = tab.id;
  if (tab.url) {
    state.checkDataSourcePageTabUrl = tab.url;
    state.checkDataSourcePageTabUrls = [tab.url];
    sendMsgToDevconsole({
      type: 'devconsole',
      name: 'visitedPagePaths',
      params: state.checkDataSourcePageTabUrls,
    });
  }
  return tab;
}

/**
 * Close the data source tab by id.
 */
export async function closeDataSourceTab(tabId) {
  if (tabId) {
    await chrome.tabs.remove(tabId);
  }
}

/**
 * Inject catchFavicon script into the data source tab.
 */
export async function injectContentScripts(tabId) {
  if (!tabId) return;
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['catchFavicon.bundle.js'],
  });
}

/**
 * Register tab update and tab removed listeners for the data source tab. Call once after createDataSourceTab.
 */
let handleTabUpdateRef = null;

export function setupTabListeners() {
  const state = getDevconsoleState();

  handleTabUpdateRef = async (tabId, changeInfo, tab) => {
    if (tabId !== state.checkDataSourcePageTabId) return;
    state.checkDataSourcePageTabUrl = tab.url;
    if (changeInfo.url && !state.checkDataSourcePageTabUrls.includes(tab.url)) {
      state.checkDataSourcePageTabUrls.push(tab.url);
      sendMsgToDevconsole({
        type: 'devconsole',
        name: 'visitedPagePaths',
        params: state.checkDataSourcePageTabUrls,
      });
    }
    if (changeInfo.favIconUrl) {
      sendMsgToDevconsole({
        type: 'devconsole',
        name: 'FAVICON_URL',
        params: { url: changeInfo.favIconUrl },
      });
    }
    if (changeInfo.status === 'complete') {
      await injectContentScripts(state.checkDataSourcePageTabId);
    }
  };

  chrome.tabs.onUpdated.addListener(handleTabUpdateRef);

  chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === state.checkDataSourcePageTabId) {
      console.log('devconsole-user close data source page');
      chrome.runtime.sendMessage({ type: 'devconsole', name: 'close' });
      if (handleTabUpdateRef) {
        chrome.tabs.onUpdated.removeListener(handleTabUpdateRef);
      }
      removeRequestCapture();
      state.checkDataSourcePageTabId = null;
    }
  });
}
