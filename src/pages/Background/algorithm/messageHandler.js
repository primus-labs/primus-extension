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
import { SDK_START_ATTESTATION_LOCK_REQUEST_ID_KEY } from '@/config/constants';
import {
  getSdkAttestationPresetFromStorage,
  getSdkAttestationSessionFromStorage,
  SDK_ATTESTATION_PRESET_STORAGE_KEYS,
  SDK_ATTESTATION_SESSION_STORAGE_KEYS,
} from '../padoZKAttestationJSSDK/sessionStorage.js';
import { isCurrentRequestId } from '../padoZKAttestationJSSDK/sessionOwnershipLock.js';

export async function algorithmMsgListener(
  message,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const ack = createAlgorithmMessageAck(sendResponse);
  try {
    const { resMethodName } = message;

    const storage = await safeStorageGet([
      ...SDK_ATTESTATION_SESSION_STORAGE_KEYS,
      'configMap',
      'activeRequestAttestation',
      SDK_START_ATTESTATION_LOCK_REQUEST_ID_KEY,
      ...SDK_ATTESTATION_PRESET_STORAGE_KEYS,
    ]);

    const session = getSdkAttestationSessionFromStorage(storage);
    const preset = getSdkAttestationPresetFromStorage(storage);
    const dappTabId = session?.ownerTabId;
    const activeRequestId =
      storage[SDK_START_ATTESTATION_LOCK_REQUEST_ID_KEY];

    if (
      (resMethodName === 'getAttestation' ||
        resMethodName === 'getAttestationResult') &&
      !isCurrentRequestId(activeRequestId, message.requestid)
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
          processAlgorithmReq,
          message.requestid
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
