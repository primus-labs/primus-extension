/**
 * SDK and data source page messaging; attestation cancel/error and event reporting.
 */
import { sendMsgToTab } from '../utils/utils';
import { handleAttestationError } from './utils';
import { eventReport } from '@/services/api/usertracker';
import { ERROR_USER_CANCELLED } from '@/config/errorCodes';
import { getPageDecodeState } from './state';
import { safeJsonParse } from '@/utils/utils';
import { stopKeepAlive } from '../utils/keepAlive.js';
import {
  teardownSdkAttestationRuntimeStateForRequest,
} from '../padoZKAttestationJSSDK/sessionStorage.js';
import { captureSdkTabMessageSender, createTabMessageSender } from '../utils/msgTransfer.js';

const CLIENTTYPE = '@primuslabs/extension';

export async function sendMsgToSdk(msg) {
  const sendToSdk = await captureSdkTabMessageSender();
  await sendToSdk(msg);
}

/** @returns {Promise<boolean>} */
export async function sendMsgToDataSourcePage(msg) {
  const { state } = getPageDecodeState();
  if (!state.dataSourcePageTabId) {
    return false;
  }
  return sendMsgToTab(state.dataSourcePageTabId, msg);
}

export async function handlerForSdk(processAlgorithmReq, operation, requestId) {
  const teardown = await teardownSdkAttestationRuntimeStateForRequest(
    requestId,
    {
      onCleared: processAlgorithmReq
        ? async () => {
            stopKeepAlive();
            await processAlgorithmReq({
              reqMethodName: 'stop',
              params: { noRestart: true },
            });
          }
        : undefined,
    }
  );
  if (!teardown.cleared) return false;

  const sendToSdk = createTabMessageSender(teardown.session?.ownerTabId);
  if (teardown.session?.sdkVersion) {
    const desc = `The user ${operation} the attestation`;
    const resParams = {
      result: false,
      errorData: { desc, code: ERROR_USER_CANCELLED },
      reStartFlag: true,
    };
    try {
      await sendToSdk({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: resParams,
      });
    } catch (error) {
      console.log('handlerForSdk error:', error);
    }
  }
  return true;
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
export async function handleDataSourcePageDialogTimeout(
  processAlgorithmReq,
  requestId
) {
  const eventInfo = {
    eventType: 'ATTESTATION_GENERATE',
    rawData: {
      status: 'FAILED',
      detail: { code: '00014', desc: '' },
    },
  };
  const teardown = await handleAttestationError(
    {
      desc: 'The process did not respond within 2 minutes. Please try again later.',
      code: '00014',
    },
    undefined,
    {
      requestId,
      onCleared: async () => {
        stopKeepAlive();
        await processAlgorithmReq({
          reqMethodName: 'stop',
          params: { noRestart: true },
        });
      },
    }
  );
  if (!teardown) return false;

  const {
    session,
    preset: sdkPreset,
    activeRequestAttestation,
    getAttestationResultRes,
  } = teardown;

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


  if (session?.sdkVersion && sdkPreset) {
    const parsed = sdkPreset;
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
    }
  }

  return true;
}
