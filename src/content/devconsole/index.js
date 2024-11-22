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
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { type, name, params } = message;
  if (type === 'devconsole') {
    console.log('devconsole-content-listen-chrome-message', message);
    if (name === 'checkDataSourceRes') {
      window.postMessage({
        target: 'devconsole',
        origin: 'primusExtension',
        name: 'checkDataSourceRes',
        params,
      });
    }
  }
});
