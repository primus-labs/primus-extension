/**
 * Init attestation: fetch config, store dapp tab id, handle initAttestation message.
 */
import { getSysConfig } from '@/services/api/config';
import { updateAlgoUrl } from '@/services/api/algorithmUrlSync';
import { getAlgoApi } from './utils';
import { sendInitAttestationRes } from '../utils/msgTransfer.js';
import {
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
} from '@/config/constants';
import { safeStorageGet, safeStorageSet } from '@/utils/safeStorage';

const sdkState = {
  hasGetTwitterScreenName: false,
  sdkParams: {},
  sdkVersion: '',
  sdkName: '',
  isNetworkSdk: false,
};

/** Set by message handler so tab-removed listener can stop algorithm. */
let processAlgorithmReqRef = null;

export function setProcessAlgorithmReqRef(fn) {
  processAlgorithmReqRef = fn;
}

export function getProcessAlgorithmReqRef() {
  return processAlgorithmReqRef;
}

export function getSdkState() {
  return sdkState;
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

export async function storeDappTabId(id) {
  await safeStorageSet({
    padoZKAttestationJSSDKDappTabId: id,
  });
  return id;
}

/**
 * Handle initAttestation: fetch config, store dapp tab, start algorithm, optionally update algo URL.
 */
export async function handleInitAttestation(params, senderTabId, processAlgorithmReq) {
  console.log(
    'debuge-zktls-initAttestation',
    params?.sdkVersion,
    'dapptabTabId:',
    senderTabId
  );

  await fetchConfigure();

  const {
    [SDK_START_ATTESTATION_LOCK_TAB_ID_KEY]: startAttestationLockTabId,
    [SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY]: startAttestationLockStartedAt,
  } = await safeStorageGet([
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
  ]);
  if (
    startAttestationLockTabId != null &&
    senderTabId != null &&
    startAttestationLockTabId !== senderTabId
  ) {
    console.log(
      'debuge-zktls-initAttestation-skip-owner-override',
      JSON.stringify({
        senderTabId,
        ownerTabId: startAttestationLockTabId,
        startedAt: startAttestationLockStartedAt ?? null,
      })
    );
    await sendInitAttestationRes(senderTabId);
    return;
  }

  sdkState.sdkVersion = params?.sdkVersion;
  sdkState.sdkName = params?.sdkName;
  sdkState.isNetworkSdk = !!(sdkState.sdkName && sdkState.sdkName.indexOf('network') > -1);

  const dappTabId = await storeDappTabId(senderTabId);

  await safeStorageSet({
    padoZKAttestationJSSDKBeginAttest: sdkState.sdkVersion,
    padoZKAttestationJSSDKClientType: params?.clientType || '',
  });
  processAlgorithmReq({ reqMethodName: 'start' });

  if (!sdkState.isNetworkSdk) {
    updateAlgoUrl();
  }
  console.log('333pado-bg-receive-initAttestation', dappTabId);
}
