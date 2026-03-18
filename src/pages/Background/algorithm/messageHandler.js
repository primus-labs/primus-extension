/**
 * Algorithm message router: dispatches by resMethodName (start, getAttestation, getAttestationResult).
 */
import { sendInitAttestationRes } from '../utils/msgTransfer.js';
import { handleGetAttestation, handleGetAttestationResult } from './attestationHandler.js';
import { safeStorageGet } from '@/utils/safeStorage';

export async function algorithmMsgListener(
  message,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const { resMethodName } = message;

  const storage = await safeStorageGet([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
    'configMap',
    'activeRequestAttestation',
    'padoZKAttestationJSSDKAttestationPresetParams',
  ]);

  const { padoZKAttestationJSSDKBeginAttest, padoZKAttestationJSSDKDappTabId: dappTabId } = storage;

  if (resMethodName === 'start') {
    processAlgorithmReq({ reqMethodName: 'init' });
  }

  if (padoZKAttestationJSSDKBeginAttest) {
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
        storage,
        sender,
        sendResponse,
        processAlgorithmReq
      );
    }
  }
}
