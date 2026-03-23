/**
 * Pado ZK Attestation SDK message router. Dispatches by message name and registers tab-removed listener.
 */
import { handleInitAttestation } from './init.js';
import {
  handleStartAttestation,
  handleGetAttestationResult,
  handleGetAttestationResultTimeout,
  handleDappTabRemoved,
} from './attestation.js';
import { setProcessAlgorithmReqRef } from './init.js';
import { closeSdkDataSourceTabWithoutCancel } from '../pageDecode/closeDataSourceTab.js';

export async function padoZKAttestationJSSDKMsgListener(
  request,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const { name, params } = request;

  setProcessAlgorithmReqRef(processAlgorithmReq);

  if (name === 'closeDataSourceTab') {
    try {
      await closeSdkDataSourceTabWithoutCancel();
    } catch (e) {
      console.log('closeDataSourceTab', e);
    } finally {
      try {
        sendResponse?.({});
      } catch (_e) {}
    }
    return;
  }

  if (name === 'initAttestation') {
    await handleInitAttestation(
      params,
      sender.tab?.id,
      processAlgorithmReq
    );
  }

  if (name === 'startAttestation') {
    await handleStartAttestation(
      params,
      sender,
      sendResponse,
      processAlgorithmReq
    );
  }

  if (name === 'getAttestationResult') {
    handleGetAttestationResult(processAlgorithmReq);
  }

  if (name === 'getAttestationResultTimeout') {
    await handleGetAttestationResultTimeout(
      sender,
      sendResponse,
      processAlgorithmReq
    );
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  handleDappTabRemoved(tabId);
});
