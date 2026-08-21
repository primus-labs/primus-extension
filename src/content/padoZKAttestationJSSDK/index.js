const appendKaitoPadoTrace = (eventName, extra = {}) => {
  try {
    chrome.storage.local.get(['kaitoPadoMessageTrace']).then((storage) => {
      const trace = Array.isArray(storage.kaitoPadoMessageTrace)
        ? storage.kaitoPadoMessageTrace
        : [];
      trace.push({
        at: Date.now(),
        side: 'content',
        event: eventName,
        ...extra,
      });
      chrome.storage.local.set({
        kaitoPadoMessageTrace: trace.slice(-80),
      });
    });
  } catch {}
};

window.addEventListener('message', (e) => {
  const { target, name, params } = e.data;
  if (target === 'padoExtension' || target === 'kaitoPadoExtension') {
    // console.log('333pado-content-sdk-listen-message', e.data);
    if (name === 'initAttestation') {
      appendKaitoPadoTrace('page_to_content_initAttestation', {
        hasSdkVersion: Boolean(params?.sdkVersion),
      });
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'initAttestation',
        params: {
          hostname: window.location.hostname,
          ...params,
        },
      });
    }
    if (name === 'startAttestation') {
      appendKaitoPadoTrace('page_to_content_startAttestation', {
        hasSdkVersion: Boolean(params?.sdkVersion),
        hasAttRequest: Boolean(params?.attRequest),
        hasKaitoTemplate: Boolean(params?.kaitoTemplate),
      });
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestation',
        params,
      });
    }
    if (name === 'getAttestationResult') {
      appendKaitoPadoTrace('page_to_content_getAttestationResult');
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationResult',
        params,
      });
    }
    if (name === 'getAttestationResultTimeout') {
      appendKaitoPadoTrace('page_to_content_getAttestationResultTimeout');
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationResultTimeout',
        params,
      });
    }
    if (name === 'checkIsInstalled') {
      appendKaitoPadoTrace('page_to_content_checkIsInstalled');
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'checkIsInstalledRes',
        params: true,
      });
    }

    // if (name === 'beforeunload') {
    //   console.log('sdk-content-padoZKAttestationJSSDK-beforeunload')
    //   var msgObj = {
    //     type: 'pageDecode',
    //     name: 'cancel',
    //   };
    //   chrome.runtime.sendMessage(msgObj);
    // }
    // if (name === 'stopOffscreen') {
    //   window.postMessage({
    //     target: 'padoZKAttestationJSSDK',
    //     origin: 'padoExtension',
    //     name: 'stopOffscreen',
    //   });
    // }
    if (name === 'sendToChainRes') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'sendToChainRes',
        params,
      });
    }
    if (name === 'removeActiveAttestation') {
      chrome.storage.local.remove([
        'padoZKAttestationJSSDKBeginAttest',
        'padoZKAttestationJSSDKWalletAddress',
        'padoZKAttestationJSSDKAttestationPresetParams',
        'padoZKAttestationJSSDKXFollowerCount',
        'activeRequestAttestation',
      ]);
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { type, name, params } = message;
  if (type === 'padoZKAttestationJSSDK') {
    if (name === 'initAttestationRes') {
      appendKaitoPadoTrace('content_to_page_initAttestationRes', {
        result: params?.result === true,
      });
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'initAttestationRes',
        params,
      });
      // jssdk-init-completed
    }

    if (name === 'getAttestationRes') {
      appendKaitoPadoTrace('content_to_page_getAttestationRes', {
        result: params?.result === true,
        errorCode: params?.errorData?.code || null,
      });
      console.log(
        'dappTab receive getAttestationRes msg',
        'time:',
        new Date().toLocaleString(),
        'resParams',
        JSON.stringify(params)
      );
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'getAttestationRes',
        params,
      });
      console.log('padoExtension-content-sdk-receive-getAttestation', params);
    }

    if (name === 'startAttestationRes') {
      appendKaitoPadoTrace('content_to_page_startAttestationRes', {
        result: params?.result === true,
        errorCode: params?.errorData?.code || null,
      });
      console.log(
        'padoExtension-content-sdk-receive-startAttestationRes',
        'time:',
        new Date().toLocaleString(),
        'params',
        JSON.stringify(params)
      );
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'startAttestationRes',
        params,
      });
    }

    if (name === 'sendToChainRes') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'sendToChainRes',
        params,
      });
    }
    if (name === 'followX') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'followX',
        params,
      });
    }
  }
});
