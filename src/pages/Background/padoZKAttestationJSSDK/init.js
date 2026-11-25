/**
 * Init attestation: fetch config, store dapp tab id, handle initAttestation message.
 */
import { getSysConfig } from '@/services/api/config';
import { updateAlgoUrl } from '@/services/api/algorithmUrlSync';
import {
  sendInitAttestationRes,
  sendSdkOwnershipError,
} from '../utils/msgTransfer.js';
import { safeStorageSet } from '@/utils/safeStorage';
import {
  getSdkInitializationSession,
  getSdkStartAttestationLockTabId,
  removeSdkInitializationSession,
  setSdkAttestationSession,
  setSdkInitializationSession,
} from './sessionStorage.js';
import {
  withSdkInitializationLock,
  withSdkProofOwnershipLock,
} from './sessionLifecycle.js';

const sdkState = {
  hasGetTwitterScreenName: false,
  sdkParams: {},
  sdkVersion: '',
  sdkName: '',
  isNetworkSdk: false,
};

/** Set by message handler so tab-removed listener can stop algorithm. */
let processAlgorithmReqRef = null;
const pendingInitializationTabIds = new Set();

export function setProcessAlgorithmReqRef(fn) {
  processAlgorithmReqRef = fn;
}

export function getProcessAlgorithmReqRef() {
  return processAlgorithmReqRef;
}

export function getSdkState() {
  return sdkState;
}

export function completePendingSdkInitialization(tabId) {
  if (!pendingInitializationTabIds.has(tabId)) return false;
  pendingInitializationTabIds.delete(tabId);
  return true;
}

export function consumePendingSdkInitializationTabIds() {
  const tabIds = [...pendingInitializationTabIds];
  pendingInitializationTabIds.clear();
  return tabIds;
}

export async function fetchConfigure() {
  try {
    const { rc, result } = await getSysConfig();
    if (rc === 0 && result) {
      const configMap = result.reduce((prev, curr) => {
        const { configName, configValue } = curr;
        prev[configName] = configValue;
        return prev;
      }, {});
      await safeStorageSet({
        configMap: JSON.stringify(configMap),
      });
    }
  } catch (_err) {
    // ignore
  }
}

/**
 * Handle initAttestation: fetch config, store dapp tab, start algorithm, optionally update algo URL.
 */
export async function handleInitAttestation(
  params,
  senderTabId,
  senderUrl,
  processAlgorithmReq
) {
  console.log(
    'debuge-zktls-initAttestation',
    params?.sdkVersion,
    'dapptabTabId:',
    senderTabId
  );

  await fetchConfigure();

  if (!Number.isInteger(senderTabId)) return false;

  const initialized = await withSdkInitializationLock(async () => {
    const currentSession = await getSdkInitializationSession(senderTabId);
    let origin = '';
    try {
      origin = senderUrl ? new URL(senderUrl).origin : '';
    } catch (_error) {
      origin = '';
    }
    const session = {
      ownerTabId: senderTabId,
      clientType: params?.clientType || '',
      sdkVersion: params?.sdkVersion || '',
      sdkName: params?.sdkName || '',
      hostname: params?.hostname || '',
      origin,
      active: true,
    };
    await setSdkInitializationSession(session);

    if (currentSession?.active) {
      await sendInitAttestationRes(senderTabId);
      return true;
    }

    const routed = await withSdkProofOwnershipLock(async () => {
      const activeProofTabId = await getSdkStartAttestationLockTabId();
      if (activeProofTabId != null) {
        await sendInitAttestationRes(senderTabId);
        return true;
      }

      await setSdkAttestationSession(session);
      pendingInitializationTabIds.add(senderTabId);
      try {
        await processAlgorithmReq({
          reqMethodName: 'start',
          params: {
            initializationTabId: senderTabId,
            ensureAlgorithmInit: true,
          },
        });
      } catch (error) {
        completePendingSdkInitialization(senderTabId);
        await removeSdkInitializationSession(senderTabId);
        await sendSdkOwnershipError('initAttestation', senderTabId, false);
        console.log('SDK initialization failed', error);
        return false;
      }
      return true;
    });
    if (!routed) return false;

    const isNetworkSdk =
      session.sdkName && session.sdkName.indexOf('network') > -1;
    if (!isNetworkSdk) updateAlgoUrl();
    return true;
  });

  console.log('333pado-bg-receive-initAttestation', senderTabId);
  return initialized;
}
