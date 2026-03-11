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

export async function devconsoleMsgListener(request, sender, _sendResponse) {
  const { name, params } = request;
  const state = getDevconsoleState();

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
}
