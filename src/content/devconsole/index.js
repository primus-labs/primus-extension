window.addEventListener('message', (e) => {
  const { target, name, params } = e.data;
  if (target === 'primusExtension') {
    console.log('devconsole-content-listen-message', e.data);
    if (name === 'checkDataSource') {
      chrome.runtime.sendMessage({
        type: 'devconsole',
        name: 'init',
        params,
      });
    } else if (name === 'closeDataSource') {
      console.log('debuge-zktls-closeDataSource-content');
      chrome.runtime.sendMessage({
        type: 'devconsole',
        name: 'closeDataSource',
        params,
      });
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
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
    }
  }
});
