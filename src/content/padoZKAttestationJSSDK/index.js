import { safeStorageRemove } from '@/utils/safeStorage';
import { sendMessageWithRetry } from '@/utils/contentMessaging';

let removeInFlight = false;

window.addEventListener('message', (e) => {
  const { target, name, params } = e.data;
  if (target === 'padoExtension') {
    // console.log('333pado-content-sdk-listen-message', e.data);
    if (name === 'initAttestation') {
      sendMessageWithRetry({
        type: 'padoZKAttestationJSSDK',
        name: 'initAttestation',
        params: {
          hostname: window.location.hostname,
          ...params,
        },
      }).catch(() => {});
    }
    if (name === 'startAttestation') {
      sendMessageWithRetry({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestation',
        params,
      }).catch(() => {});
    }
    if (name === 'getAttestationResult') {
      sendMessageWithRetry({
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationResult',
        params,
      }).catch(() => {});
    }
    if (name === 'getAttestationResultTimeout') {
      sendMessageWithRetry({
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationResultTimeout',
        params,
      }).catch(() => {});
    }
    if (name === 'checkIsInstalled') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'checkIsInstalledRes',
        params: true,
      });
    }
    
    if (name === 'removeActiveAttestation') {
      if (removeInFlight) return;
      removeInFlight = true;
      const keys = [
        'padoZKAttestationJSSDKBeginAttest',
        'padoZKAttestationJSSDKWalletAddress',
        'padoZKAttestationJSSDKAttestationPresetParams',
        'activeRequestAttestation',
      ];
      safeStorageRemove(keys).finally(() => {
        removeInFlight = false;
      });
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
  const { type, name, params } = message;
  if (type === 'padoZKAttestationJSSDK') {
    if (name === 'initAttestationRes') {
      window.postMessage({
        target: 'padoZKAttestationJSSDK',
        origin: 'padoExtension',
        name: 'initAttestationRes',
        params,
      });
      // jssdk-init-completed
    }

    if (name === 'getAttestationRes') {
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

  }
});
