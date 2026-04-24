/**
 * Pado ZK Attestation SDK message router. Dispatches by message name and registers tab-removed listener.
 */
import { handleInitAttestation } from './init.js';
import { clearSdkAttestationRuntimeState } from './sessionStorage.js';
import {
  handleStartAttestation,
  handleGetAttestationResult,
  handleGetAttestationResultTimeout,
  handleDappTabRemoved,
} from './attestation.js';
import { setProcessAlgorithmReqRef } from './init.js';
import {
  cleanupPageDecodeWithoutCancel,
  closeSdkDataSourceTabWithoutCancel,
} from '../pageDecode/closeDataSourceTab.js';
import { stopKeepAlive } from '../utils/keepAlive.js';

export async function padoZKAttestationJSSDKMsgListener(
  request,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const { name, params } = request;
  let responded = false;
  const respondOnce = (payload = { ok: true }) => {
    if (responded) return;
    responded = true;
    try {
      sendResponse?.(payload);
    } catch (_e) {
      // Ignore closed or invalid message ports.
    }
  };

  setProcessAlgorithmReqRef(processAlgorithmReq);

  if (name === 'closeDataSourceTab') {
    try {
      await closeSdkDataSourceTabWithoutCancel();
    } catch (e) {
      console.log('closeDataSourceTab', e);
    } finally {
      respondOnce({});
    }
    return;
  }

  if (name === 'removeActiveAttestation') {
    stopKeepAlive();
    await cleanupPageDecodeWithoutCancel();
    await clearSdkAttestationRuntimeState();
    try {
      await processAlgorithmReq({ reqMethodName: 'stop', params: { noRestart: true } });
    } catch (e) {
      console.log('removeActiveAttestation stop error', e);
    }
    respondOnce({});
    return;
  }

  if (name === 'initAttestation') {
    await handleInitAttestation(
      params,
      sender.tab?.id,
      processAlgorithmReq
    );
    respondOnce();
    return;
  }

  if (name === 'startAttestation') {
    await handleStartAttestation(
      params,
      sender,
      respondOnce,
      processAlgorithmReq
    );
    respondOnce();
    return;
  }

  if (name === 'getAttestationResult') {
    handleGetAttestationResult(processAlgorithmReq);
    respondOnce();
    return;
  }

  if (name === 'getAttestationResultTimeout') {
    await handleGetAttestationResultTimeout(
      sender,
      respondOnce,
      processAlgorithmReq
    );
    respondOnce();
    return;
  }

  respondOnce();
}

chrome.tabs.onRemoved.addListener((tabId) => {
  handleDappTabRemoved(tabId);
});
