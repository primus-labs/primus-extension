/**
 * Pado ZK Attestation SDK message router. Dispatches by message name and registers tab-removed listener.
 */
import { handleInitAttestation } from './init.js';
import {
  getSdkAttestationSession,
  getSdkInitializationSession,
  teardownSdkAttestationRuntimeStateForRequest,
} from './sessionStorage.js';
import { authorizeSdkMessage } from './sdkMessageOwnership.js';
import {
  handleStartAttestation,
  handleGetAttestationResult,
  handleGetAttestationResultTimeout,
  handleDappTabRemoved,
  handleDappTabNavigated,
} from './attestation.js';
import { setProcessAlgorithmReqRef } from './init.js';
import { sendSdkOwnershipError } from '../utils/msgTransfer.js';
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

  const senderTabId = sender?.tab?.id;
  const [activeSession, initializedSession] = await Promise.all([
    getSdkAttestationSession(),
    getSdkInitializationSession(senderTabId),
  ]);
  const authorized = await authorizeSdkMessage({
    name,
    senderTabId,
    initializedOwnerTabId: initializedSession?.ownerTabId,
    activeOwnerTabId: activeSession?.ownerTabId,
    onBlocked: async (hasOwner) => {
      console.warn('blocked SDK message from non-owner tab', {
        name,
        tabId: senderTabId,
      });
      if (
        name === 'initAttestation' ||
        name === 'startAttestation' ||
        name === 'getAttestationResult' ||
        name === 'getAttestationResultTimeout'
      ) {
        await sendSdkOwnershipError(name, senderTabId, hasOwner);
      }
    },
    respond: respondOnce,
  });
  if (!authorized) {
    return;
  }

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
    await teardownSdkAttestationRuntimeStateForRequest(params?.requestId, {
      onCleared: async () => {
        stopKeepAlive();
        await cleanupPageDecodeWithoutCancel();
        try {
          await processAlgorithmReq({
            reqMethodName: 'stop',
            params: { noRestart: true },
          });
        } catch (e) {
          console.log('removeActiveAttestation stop error', e);
        }
      },
    });
    respondOnce({});
    return;
  }

  if (name === 'initAttestation') {
    const initialized = await handleInitAttestation(
      params,
      sender.tab?.id,
      sender?.url,
      processAlgorithmReq
    );
    respondOnce({ ok: initialized });
    return;
  }

  if (name === 'startAttestation') {
    await handleStartAttestation(
      params,
      sender,
      respondOnce,
      processAlgorithmReq,
      params?.requestId
    );
    respondOnce();
    return;
  }

  if (name === 'getAttestationResult') {
    await handleGetAttestationResult(processAlgorithmReq, params?.requestId);
    respondOnce();
    return;
  }

  if (name === 'getAttestationResultTimeout') {
    await handleGetAttestationResultTimeout(
      sender,
      respondOnce,
      processAlgorithmReq,
      params?.requestId
    );
    respondOnce();
    return;
  }

  respondOnce();
}

chrome.tabs.onRemoved.addListener((tabId) => {
  handleDappTabRemoved(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) handleDappTabNavigated(tabId, changeInfo.url);
});
