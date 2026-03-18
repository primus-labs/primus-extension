import { sendMessageWithRetry } from '@/utils/contentMessaging';

window.addEventListener('message', (e) => {
  const { target, name, params } = e.data;
  if (target === 'primusExtension') {
    // console.log('devconsole-content-listen-message', e.data);
    if (name === 'checkDataSource') {
      sendMessageWithRetry({
        type: 'devconsole',
        name: 'init',
        params,
      }).catch(() => {});
    } else if (name === 'closeDataSource') {
      console.log('debuge-zktls-closeDataSource-content');
      sendMessageWithRetry({
        type: 'devconsole',
        name: 'closeDataSource',
        params,
      }).catch(() => {});
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
  const { type, name, params } = message;
  if (type === 'devconsole') {
    console.log('devconsole-content-listen-chrome-message', name, message);
    if (name === 'checkDataSourceRes') {
      window.postMessage({
        target: 'devconsole',
        origin: 'primusExtension',
        name: 'checkDataSourceRes',
        params,
      });
    } else if (name === 'close') {
      window.postMessage({
        target: 'devconsole',
        origin: 'primusExtension',
        name: 'close',
        params,
      });
    } else if (name === 'FAVICON_URL') {
      window.postMessage({
        target: 'devconsole',
        origin: 'primusExtension',
        name: 'FAVICON_URL',
        params,
      });
    } else if (name === 'visitedPagePaths') {
      window.postMessage({
        target: 'devconsole',
        origin: 'primusExtension',
        name: 'visitedPagePaths',
        params,
      });
    }
  }
});
