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

export async function padoZKAttestationJSSDKMsgListener(
  request,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const { name, params } = request;

  setProcessAlgorithmReqRef(processAlgorithmReq);

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
