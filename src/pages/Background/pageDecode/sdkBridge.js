/**
 * SDK and data source page messaging; attestation cancel/error and event reporting.
 */
import { sendMsgToTab } from '../utils/utils';
import { handleAttestationError } from './utils';
import { eventReport } from '@/services/api/usertracker';
import { ERROR_USER_CANCELLED } from '@/config/errorCodes';
import {
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
} from '@/config/constants';
import { getPageDecodeState } from './state';
import { safeStorageGet, safeStorageRemove } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';
import { stopKeepAlive } from '../utils/keepAlive.js';

const CLIENTTYPE = '@primuslabs/extension';

export async function sendMsgToSdk(msg) {
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await safeStorageGet(['padoZKAttestationJSSDKDappTabId']);
  if (dappTabId) {
    await sendMsgToTab(dappTabId, msg);
  }
}

export async function sendMsgToDataSourcePage(msg) {
  const { state } = getPageDecodeState();
  if (state.dataSourcePageTabId) {
    sendMsgToTab(state.dataSourcePageTabId, msg);
  }
}

export async function handlerForSdk(processAlgorithmReq, operation) {
  const {
    padoZKAttestationJSSDKBeginAttest,
    [SDK_START_ATTESTATION_LOCK_TAB_ID_KEY]: startAttestationLockTabId,
    activeRequestAttestation: lastActiveRequestAttestationStr,
  } = await safeStorageGet([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    'activeRequestAttestation',
  ]);
  if (processAlgorithmReq && (lastActiveRequestAttestationStr || startAttestationLockTabId != null)) {
    processAlgorithmReq({ reqMethodName: 'stop' });
  }
  if (padoZKAttestationJSSDKBeginAttest) {
    stopKeepAlive();
    await safeStorageRemove([
      SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
      SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'activeRequestAttestation',
      'padoZKAttestationJSSDKClientType',
    ]);
    const desc = `The user ${operation} the attestation`;
    const resParams = {
      result: false,
      errorData: { desc, code: ERROR_USER_CANCELLED },
      reStartFlag: true,
    };
    try {
      await sendMsgToSdk({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: resParams,
      });
    } catch (error) {
      console.log('handlerForSdk error:', error);
    }
  }
}

export async function eventReportGenerateFn(rawData) {
  eventReport({ eventType: 'ATTESTATION_GENERATE', rawData });
}

/** Target data missing (e.g. JSON path mismatch). */
export async function handleTargetDataMissing(options = {}) {
  await handleAttestationError(
    {
      desc:
        'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
      code: '00013',
    },
    undefined,
    options
  );
}

/** 2-minute timeout on data source dialog; report failure and stop algorithm. */
export async function handleDataSourcePageDialogTimeout(processAlgorithmReq) {
  const eventInfo = {
    eventType: 'ATTESTATION_GENERATE',
    rawData: {
      status: 'FAILED',
      detail: { code: '00014', desc: '' },
    },
  };
  const storage = await safeStorageGet([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'activeRequestAttestation',
    'getAttestationResultRes',
  ]);
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKAttestationPresetParams,
    activeRequestAttestation,
    getAttestationResultRes,
  } = storage;

  const { state } = getPageDecodeState();

  const eventReportFn = async (rawData) => {
    if (activeRequestAttestation) {
      Object.assign(rawData, {
        ext: { ...rawData.ext, getAttestationResultRes },
      });
    }
    if (!getAttestationResultRes) {
      await eventReportGenerateFn(rawData);
    }
  };


  if (padoZKAttestationJSSDKBeginAttest && padoZKAttestationJSSDKAttestationPresetParams) {
    const parsed = safeJsonParse(padoZKAttestationJSSDKAttestationPresetParams, {}) || {};
    if (!state.reportRequestIds.includes(parsed.requestid)) {
      state.reportRequestIds.push(parsed.requestid);
      const { dataSourceId, attTemplateID, ext: { appSignParameters }, clientType } = parsed;
      Object.assign(eventInfo.rawData, {
        source: dataSourceId,
        clientType,
        appId: '',
        templateId: attTemplateID,
        address: safeJsonParse(appSignParameters)?.userAddress,
        ext: {},
      });
      await eventReportFn(eventInfo.rawData);
    }
  } else if (activeRequestAttestation) {
    const parsed = safeJsonParse(activeRequestAttestation, {}) || {};
    if (!state.reportRequestIds.includes(parsed.requestid)) {
      state.reportRequestIds.push(parsed.requestid);
      const { source, schemaType, sigFormat, user, event } = parsed;
      Object.assign(eventInfo.rawData, {
        source,
        clientType: CLIENTTYPE,
        appId: '',
        templateId: schemaType,
        address: user?.address,
        ext: { sigFormat, event },
      });
      await eventReportFn(eventInfo.rawData);
      await safeStorageRemove([
        SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
        SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
        'activeRequestAttestation',
      ]);
    }
  }

  stopKeepAlive();
  processAlgorithmReq({ reqMethodName: 'stop' });
  await handleAttestationError({
    desc: 'The process did not respond within 2 minutes. Please try again later.',
    code: '00014',
  });
}
