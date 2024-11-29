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
    } else if (name === 'testTemplate') {
      // TODO-zktls
      // chrome.runtime.sendMessage({
      //   type: 'devconsole',
      //   name: 'testTemplate',
      //   params,
      // });
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'initAttestation',
        params,
      });
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'padoZKAttestationJSSDK',
          name: 'startAttestation',
          params,
        });
        // TODO-zktls
        // setTimeout(() => {
        //   setInterval(() => {
        //     chrome.runtime.sendMessage({
        //       type: 'padoZKAttestationJSSDK',
        //       name: 'getAttestationResult',
        //       params: {},
        //     });
        //   }, 1000);
        // }, 10000);
        // TODO-zktls
      }, 3000);
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
    } else if (name === 'close') {
      window.postMessage({
        target: 'devconsole',
        origin: 'primusExtension',
        name: 'close',
        params,
      });
    } else if (name === 'testInterval') {
      // TODO-zktls
      setInterval(() => {
        chrome.runtime.sendMessage({
          type: 'padoZKAttestationJSSDK',
          name: 'getAttestationResult',
          params,
        });
      }, 1000);
      // TODO-zktls
    }
  }
});
