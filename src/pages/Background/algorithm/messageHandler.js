/**
 * Algorithm message router: dispatches by resMethodName (start, getAttestation, getAttestationResult).
 */
import { sendInitAttestationRes } from '../utils/msgTransfer.js';
import { handleGetAttestation, handleGetAttestationResult } from './attestationHandler.js';
import { safeStorageGet } from '@/utils/safeStorage';
import {
  getSdkAttestationPresetFromStorage,
  getSdkAttestationSessionFromStorage,
  SDK_ATTESTATION_PRESET_STORAGE_KEYS,
  SDK_ATTESTATION_SESSION_STORAGE_KEYS,
} from '../padoZKAttestationJSSDK/sessionStorage.js';

export async function algorithmMsgListener(
  message,
  sender,
  sendResponse,
  processAlgorithmReq
) {
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
        sendResponse,
        processAlgorithmReq
      );
    }
    if (resMethodName === 'getAttestationResult') {
      await handleGetAttestationResult(
        message,
        { ...storage, sdkAttestationSession: session, sdkAttestationPreset: preset },
        sender,
        sendResponse,
        processAlgorithmReq
      );
    }
  }
}
