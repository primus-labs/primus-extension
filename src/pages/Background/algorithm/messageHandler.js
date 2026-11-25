/**
 * Algorithm message router: dispatches by resMethodName (start, getAttestation, getAttestationResult).
 */
import { sendInitAttestationRes } from '../utils/msgTransfer.js';
import {
  createAlgorithmMessageAck,
  handleGetAttestation,
  handleGetAttestationResult,
} from './attestationHandler.js';
import { safeStorageGet } from '@/utils/safeStorage';
import {
  getSdkAttestationPresetFromStorage,
  getSdkAttestationSessionFromStorage,
  SDK_ATTESTATION_PRESET_STORAGE_KEYS,
  SDK_ATTESTATION_SESSION_STORAGE_KEYS,
} from '../padoZKAttestationJSSDK/sessionStorage.js';
import { isAlgorithmResponseFromOffscreen } from '../messageSenderPolicy.js';
import { isCurrentProofResult } from '../padoZKAttestationJSSDK/sessionLifecycle.js';
import { safeJsonParse } from '@/utils/utils';

export async function algorithmMsgListener(
  message,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const ack = createAlgorithmMessageAck(sendResponse);
  try {
    if (
      !isAlgorithmResponseFromOffscreen(
        message,
        sender,
        chrome.runtime.id,
        chrome.runtime.getURL('offscreen.html')
      )
    ) {
      console.warn('algorithmMsgListener blocked unexpected sender', {
        resMethodName: message?.resMethodName,
        tabId: sender?.tab?.id,
      });
      return;
    }

    const { resMethodName } = message;

    const storage = await safeStorageGet([
      ...SDK_ATTESTATION_SESSION_STORAGE_KEYS,
      'configMap',
      'activeRequestAttestation',
      ...SDK_ATTESTATION_PRESET_STORAGE_KEYS,
    ]);

    const session = getSdkAttestationSessionFromStorage(storage);
    const preset = getSdkAttestationPresetFromStorage(storage);
    const dappTabId = session?.ownerTabId;
    const activeRequest =
      safeJsonParse(storage.activeRequestAttestation, {}) || {};
    const activeRequestId = activeRequest.requestid || preset?.requestid;

    if (
      (resMethodName === 'getAttestation' ||
        resMethodName === 'getAttestationResult') &&
      !isCurrentProofResult(activeRequestId, message.requestid)
    ) {
      console.log(
        'ignore stale algorithm response',
        resMethodName,
        message.requestid
      );
      return;
    }

    if (resMethodName === 'start') {
      processAlgorithmReq({ reqMethodName: 'init' });
    }

    if (session?.sdkVersion) {
      if (resMethodName === 'start') {
        await sendInitAttestationRes();
      }
      if (resMethodName === 'getAttestation') {
        await handleGetAttestation(
          message,
          dappTabId,
          sender,
          ack,
          processAlgorithmReq
        );
      }
      if (resMethodName === 'getAttestationResult') {
        await handleGetAttestationResult(
          message,
          { ...storage, sdkAttestationSession: session, sdkAttestationPreset: preset },
          sender,
          ack,
          processAlgorithmReq
        );
      }
    }
  } finally {
    ack();
  }
}
