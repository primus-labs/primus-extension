/**
 * Algorithm message handlers: getAttestation (init/error) and getAttestationResult (success/warn/retcode 2).
 */
import { pageDecodeMsgListener } from '../pageDecode/index.js';
import { closeSdkDataSourceTabWithoutCancel } from '../pageDecode/closeDataSourceTab.js';
import { getErrorTipByExtraData, getAttestTipForCode } from './errorMap.js';
import {
  TOTAL_TIP_MAP,
  ERROR_UNKNOWN,
  ERROR_UNKNOWN_SUB_ALGO_MISSING_ERRCODE,
} from '@/config/errorCodes';
import {
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
} from '@/config/constants';
import { safeStorageGet, safeStorageSet, safeStorageRemove } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';
import { stopKeepAlive } from '../utils/keepAlive.js';
import {
  getNoteV2Extension,
  getNoteV2Sdk,
  resolveNoteV2MapFromConfigParsed,
} from '@/utils/attestationProcessNoteV2';
import {
  clearSdkAttestationRuntimeState,
  getSdkAttestationPresetFromStorage,
  getSdkAttestationSessionFromStorage,
} from '../padoZKAttestationJSSDK/sessionStorage.js';
import { createTabMessageSender } from '../utils/msgTransfer.js';

const HAS_GET_TWITTER_SCREEN_NAME = false;

/**
 * Async onMessage listeners return true and must call sendResponse exactly once
 * (avoids "Error message from listener couldn't be parsed or was empty").
 */
export function createAlgorithmMessageAck(sendResponse) {
  let done = false;
  return function ackAlgorithmMessage(payload = { ok: true }) {
    if (done) return;
    done = true;
    try {
      if (typeof sendResponse === 'function') {
        sendResponse(payload);
      }
    } catch (_e) {
      /* message port may already be closed */
    }
  };
}

/** Maps algorithm errlog codes to parent code 50000 + subCode for NOTE_V2 composite keys. */
const ALGO_ERR_NORMALIZE_TO_50000 = {
  50001: '501',
  50002: '502',
  50005: '505',
  50007: '507',
  50008: '508',
  50010: '510',
};

/**
 * Handle getAttestation response: map retcode to success or error, send getAttestationRes to dapp, optionally end pageDecode and stop.
 */
export async function handleGetAttestation(
  message,
  dappTabId,
  sender,
  ack,
  processAlgorithmReq
) {
  if (!message?.res) return;
  let parsed;
  try {
    parsed = JSON.parse(message.res);
  } catch {
    return;
  }
  const { retcode, isUserClick } = parsed;
  if (isUserClick !== 'true') return;

  const sendToSdk = createTabMessageSender(dappTabId);
  const { configMap } = await safeStorageGet(['configMap']);
  const noteV2Map = resolveNoteV2MapFromConfigParsed(safeJsonParse(configMap));

  const initDescFallback =
    'The algorithm has not been initialized.Please try again later.';
  let msgObj = {
    desc: initDescFallback,
    sourcePageTip: '',
  };
  let result = retcode === '0';

  if (!result) {
    const tipCode = retcode === '2' ? '00001' : '00000';
    msgObj.desc = getNoteV2Sdk(noteV2Map, tipCode, initDescFallback);
    msgObj.sourcePageTip = getNoteV2Extension(noteV2Map, tipCode, '');

    await pageDecodeMsgListener(
      {
        name: 'end',
        params: { result: 'warn', failReason: { ...msgObj } },
      },
      sender,
      ack,
      HAS_GET_TWITTER_SCREEN_NAME,
      processAlgorithmReq
    );
    stopKeepAlive();
    await clearSdkAttestationRuntimeState();
    processAlgorithmReq({ reqMethodName: 'stop', params: { noRestart: true } });
  }

  const resParams = { result };
  if (!result) {
    resParams.errorData = {
      desc: msgObj.desc,
      code: retcode === '2' ? '00001' : '00000',
      data: message.res,
    };
  }
  console.log(
    'send getAttestationRes msg to dappTab',
    'dappTabId',
    dappTabId,
    'time:',
    new Date().toLocaleString(),
    'resParams',
    JSON.stringify(resParams)
  );
  await sendToSdk({
    type: 'padoZKAttestationJSSDK',
    name: 'getAttestationRes',
    params: resParams,
  });
}

/**
 * Handle getAttestationResult response: success (sucFn), or failure with error mapping (extraData / NOTE_V2), or retcode '2'.
 */
export async function handleGetAttestationResult(
  message,
  storage,
  sender,
  ack,
  processAlgorithmReq
) {
  const {
    configMap,
    activeRequestAttestation,
  } = storage;
  const session = storage.sdkAttestationSession || getSdkAttestationSessionFromStorage(storage);
  const dappTabId = session?.ownerTabId;
  const sendToSdk = createTabMessageSender(dappTabId);
  const activeAttestationParams =
    storage.sdkAttestationPreset || getSdkAttestationPresetFromStorage(storage) || {};

  const configMapParsed = safeJsonParse(configMap);
  const noteV2Map = resolveNoteV2MapFromConfigParsed(configMapParsed);

  if (!message?.res) return;
  let parsedRes;
  try {
    parsedRes = JSON.parse(message.res);
  } catch {
    return;
  }
  const { retcode, content, details, isUserClick } = parsedRes;
  if (isUserClick !== 'true') return;

  await safeStorageSet({ getAttestationResultRes: message.res });
  const parsedActiveRequestAttestation = safeJsonParse(activeRequestAttestation, {}) || {};
  const extendedParamsObj = activeAttestationParams?.extendedParams
    ? (safeJsonParse(activeAttestationParams.extendedParams, {}) || {})
    : {};

  const sucFn = async (resData) => {
    const closeDataSourceOnProofComplete =
      activeAttestationParams.closeDataSourceOnProofComplete === true;

    await pageDecodeMsgListener(
      { name: 'end', params: { result: 'success' } },
      sender,
      ack,
      HAS_GET_TWITTER_SCREEN_NAME,
      processAlgorithmReq
    );
    stopKeepAlive();
    if (closeDataSourceOnProofComplete) {
      await closeSdkDataSourceTabWithoutCancel();
    }
    await clearSdkAttestationRuntimeState();
    await sendToSdk({
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: { result: true, data: resData },
    });
  };

  if (retcode === '0') {
    if (
      content?.balanceGreaterThanBaseValue === 'true' &&
      content?.signature
    ) {
      const activeRequestId = parsedActiveRequestAttestation.requestid;
      if (activeRequestId !== content?.requestid) {
        stopKeepAlive();
        await clearSdkAttestationRuntimeState();
        return;
      }

      const passRes = JSON.parse(content.encodedData);
      passRes.extendedData = content.extendedData;
      passRes.allJsonResponse = content.allJsonResponse;
      passRes.privateData = content.privateData;
      await sucFn(passRes);
    } else if (
      !content?.signature ||
      content?.balanceGreaterThanBaseValue === 'false'
    ) {
      let msgObj = {
        desc: '',
        sourcePageTip: '',
      };
      let errorCode;

      const extraDataStr = content?.extraData;
      const extraDataParsed = extraDataStr ? JSON.parse(extraDataStr) : null;
      const errorCodeFromExtra = extraDataParsed
        ? extraDataParsed.errorCode + ''
        : null;
      const knownCode = errorCodeFromExtra && TOTAL_TIP_MAP[errorCodeFromExtra];

      if (knownCode) {
        errorCode = errorCodeFromExtra;
        if (
          extendedParamsObj.handleReSubmitCodes &&
          extendedParamsObj.handleReSubmitCodes.includes(errorCode)
        ) {
          await sucFn({
            attestation: JSON.stringify({}),
            taskId: extendedParamsObj.taskId,
          });
          return;
        }
        const showTip = getErrorTipByExtraData(extraDataStr) ?? '';
        msgObj.desc = getNoteV2Sdk(noteV2Map, errorCode, showTip);
        msgObj.sourcePageTip = getNoteV2Extension(
          noteV2Map,
          errorCode,
          showTip
        );
      } else {
        if (!content?.signature && content?.encodedData) {
          errorCode = '00103';
          msgObj.desc = getNoteV2Sdk(noteV2Map, errorCode, '');
          msgObj.sourcePageTip = getNoteV2Extension(
            noteV2Map,
            errorCode,
            ''
          );
        } else if (
          activeAttestationParams?.verificationContent === 'Assets Proof' &&
          activeAttestationParams?.dataSourceId === 'binance'
        ) {
          errorCode = '00102';
          msgObj.desc = getNoteV2Sdk(noteV2Map, errorCode, '');
          msgObj.sourcePageTip = getNoteV2Extension(
            noteV2Map,
            errorCode,
            ''
          );
        } else {
          errorCode = '00104';
          msgObj.desc = getNoteV2Sdk(noteV2Map, errorCode, '');
          msgObj.sourcePageTip = getNoteV2Extension(
            noteV2Map,
            errorCode,
            ''
          );
        }
      }

      await pageDecodeMsgListener(
        {
          name: 'end',
          params: { result: 'warn', failReason: { ...msgObj } },
        },
        sender,
        ack,
        HAS_GET_TWITTER_SCREEN_NAME,
        processAlgorithmReq
      );
      stopKeepAlive();
      await clearSdkAttestationRuntimeState();
      const resParams = {
        result: false,
        errorData: { desc: msgObj.desc, code: errorCode },
      };
      await sendToSdk({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: resParams,
      });
    }
  } else if (retcode === '2') {
    const { errlog: { code, desc: detailsDesc } = {} } = details || {};
    const rawNum = code != null ? Number(code) : NaN;
    const mapped50000Sub = ALGO_ERR_NORMALIZE_TO_50000[rawNum];
    let resolvedCode = code;
    let resolvedSubCode;
    if (mapped50000Sub !== undefined) {
      resolvedCode = 50000;
      resolvedSubCode = mapped50000Sub;
    } else if (rawNum === 30001) {
      resolvedSubCode = detailsDesc?.match(/\b\d{3}\b/)?.[0];
    }

    const normalizedAlgoCode =
      code != null && String(code).trim() !== '' ? String(code).trim() : '';
    const hasCompositeSub =
      resolvedSubCode != null && resolvedSubCode !== '';
    const missingAlgoErrCode = !normalizedAlgoCode && !hasCompositeSub;

    let tipKeyForMessage;
    if (missingAlgoErrCode) {
      tipKeyForMessage = `${ERROR_UNKNOWN}:${ERROR_UNKNOWN_SUB_ALGO_MISSING_ERRCODE}`;
    } else if (hasCompositeSub) {
      tipKeyForMessage = `${resolvedCode}:${resolvedSubCode}`;
    } else if (code != null && code !== '') {
      tipKeyForMessage = String(code);
    } else {
      tipKeyForMessage = ERROR_UNKNOWN;
    }

    processAlgorithmReq({ reqMethodName: 'stop', params: { noRestart: true } });
    const msgObj = getAttestTipForCode(tipKeyForMessage, noteV2Map);

    await pageDecodeMsgListener(
      {
        name: 'end',
        params: { result: 'warn', failReason: { ...msgObj } },
      },
      sender,
      ack,
      HAS_GET_TWITTER_SCREEN_NAME,
      processAlgorithmReq
    );
    stopKeepAlive();
    await clearSdkAttestationRuntimeState();

    let errorCodeOut;
    /** @type {{ subCode?: string } | undefined} */
    let errorDetailsOut;
    if (missingAlgoErrCode) {
      errorCodeOut = ERROR_UNKNOWN;
      errorDetailsOut = { subCode: ERROR_UNKNOWN_SUB_ALGO_MISSING_ERRCODE };
    } else if (normalizedAlgoCode === ERROR_UNKNOWN) {
      errorCodeOut = ERROR_UNKNOWN;
      errorDetailsOut = undefined;
    } else {
      errorCodeOut = resolvedCode;
      errorDetailsOut = hasCompositeSub
        ? { subCode: resolvedSubCode }
        : undefined;
    }

    const resParams = {
      result: false,
      errorData: {
        desc: msgObj.desc,
        code: errorCodeOut,
        data: message.res,
        ...(errorDetailsOut ? { details: errorDetailsOut } : {}),
      },
      reStartFlag: true,
    };
    await sendToSdk({
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: resParams,
    });
  } else if (retcode === '1') {
    // In progress (offline/online RUNNING); polling continues.
    await safeStorageSet({
      attestationLogInQuery: message.res,
    });
  }
}
