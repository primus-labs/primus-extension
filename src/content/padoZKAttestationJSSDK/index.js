window.addEventListener('message', (e) => {
  const { target, name, params } = e.data;
  if (target === 'padoExtension') {
    console.log('333pado-content-sdk-listen-message', e.data);
    if (name === 'initAttest') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'initAttest',
      });
    }
    if (name === 'startAttest') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttest',
        params,
      });
    }
    
    if (name === 'getAttestationResult') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationResult',
        params
      });
    }
    // if (name === 'attestResult') {
    //   chrome.runtime.sendMessage({
    //     type: 'padoZKAttestationJSSDK',
    //     name: 'attestResult',
    //     params,
    //   });
    // }
    
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { type, name, params } = message;
  if (type === 'padoZKAttestationJSSDK') {
    if (name === 'initAttestRes') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'initAttestRes',
        params: true,
      });
      // jssdk-init-completed
    }
    if (name === 'getAttestationRes') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'getAttestationRes',
        params,
      });
      console.log('333-content-sdk-receive-getAttestation', params);
    }
    if (name === 'getAttestationResultRes') {
      console.log('333-content-sdk-receive-getAttestationResultRes', params);
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'getAttestationResultRes',
        params,
      });
    }
    if (name === 'startAttestationRes') {
      console.log('333-content-sdk-receive-startAttestationRes', params);
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'getAttestationResultRes',
        params,
      });
    }
    ;
  }
});
