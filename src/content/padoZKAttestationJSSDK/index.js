console.log('333web 2', +new Date());
window.addEventListener('message', (e) => {
  const { target, name, params } = e.data;
  if (target === 'padoExtension') {
    // console.log('333pado-content-sdk-listen-message', e.data);
    if (name === 'initAttestation') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'initAttestation',
        params: {
          hostname: window.location.hostname
        },
      });
    }
    if (name === 'startAttestation') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestation',
        params,
      });
    }
    if (name === 'getAttestationResult') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationResult',
        params,
      });
    }
    if (name === 'getAttestationResultTimeout') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationResultTimeout',
        params,
      });
    }
    if (name === 'checkIsInstalled') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'checkIsInstalledRes',
        params: true,
      });
    }
    
    if (name === 'beforeunload') {
      var msgObj = {
        type: 'pageDecode',
        name: 'cancel',
      };
      chrome.runtime.sendMessage(msgObj);
    }
    // if (name === 'stopOffscreen') {
    //   window.postMessage({
    //     target: 'padoZKAttestationJSSDK',
    //     origin: 'padoExtension',
    //     name: 'stopOffscreen',
    //   });
    // }
    // if (name === 'sendToChainRes') {
    //   chrome.runtime.sendMessage({
    //     type: 'padoZKAttestationJSSDK',
    //     name: 'sendToChainRes',
    //     params,
    //   });
    // }
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { type, name, params } = message;
  if (type === 'padoZKAttestationJSSDK') {
    if (name === 'initAttestationRes') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'initAttestationRes',
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

    if (name === 'startAttestationRes') {
      console.log('333-content-sdk-receive-startAttestationRes', params);
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'startAttestationRes',
        params,
      });
    }

    if (name === 'sendToChainRes') {
      console.log('333-content-sdk-receive-sendToChainRes', params);
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'sendToChainRes',
        params,
      });
    }
  }
});
