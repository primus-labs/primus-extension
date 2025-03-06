window.addEventListener('message', (e) => {
  const { target, name, params } = e.data;
  if (target === 'primusExtension') {
    if (name === 'followX') {
      chrome.runtime.sendMessage({
        type: 'lumaMonadEvent',
        name: 'followX',
        params,
      });
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { type, name, params } = message;
  if (type === 'lumaMonadEvent') {
    if (name === 'followXRes') {
      window.postMessage({
        target: 'lumaMonadEvent',
        origin: 'primusExtension',
        name: 'followXRes',
        params,
      });
    }
  }
});
