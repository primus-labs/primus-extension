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
      });
    }
    
    if (name === 'getAttestationResult') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationResult',
      });
    }
    if (name === 'attestResult') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'attestResult',
        params,
      });
    }
    
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
      console.log('333-content-sdk-recceive-getAttestation', params);
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'getAttestationRes',
        params,
      });
    }
    if (name === 'getAttestationResultRes') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'getAttestationResultRes',
        params,
      });
    }
  }
});
