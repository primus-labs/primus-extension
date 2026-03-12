/**
 * Algorithm message handlers: getAttestation (init/error) and getAttestationResult (success/warn/retcode 2).
 */
import { pageDecodeMsgListener } from '../pageDecode/index.js';
import { getErrorMsgTitleFn } from '../utils/handleError.js';
import { getErrorTipByExtraData, getAttestTipForCode } from './errorMap.js';
import { TOTAL_TIP_MAP } from '@/config/errorCodes';

const HAS_GET_TWITTER_SCREEN_NAME = false;

/**
 * Handle getAttestation response: map retcode to success or error, send getAttestationRes to dapp, optionally end pageDecode and stop.
 */
export async function handleGetAttestation(
  message,
  dappTabId,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const { retcode, isUserClick } = JSON.parse(message.res);
  if (isUserClick !== 'true') return;

  let msgObj = {
    type: 'error',
    title: '',
    desc: 'The algorithm has not been initialized.Please try again later.',
    sourcePageTip: '',
  };
  let result = retcode === '0';

  if (!result) {
    const errorMsgTitle =
      retcode === '2'
        ? 'Wrong parameters. '
        : 'Too many requests. Please try again later.';
    msgObj.title = errorMsgTitle;
    msgObj.sourcePageTip = errorMsgTitle;

    await pageDecodeMsgListener(
      {
        name: 'end',
        params: { result: 'warn', failReason: { ...msgObj } },
      },
      sender,
      sendResponse,
      HAS_GET_TWITTER_SCREEN_NAME,
      processAlgorithmReq
    );
    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKWalletAddress',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'activeRequestAttestation',
    ]);
    processAlgorithmReq({ reqMethodName: 'stop' });
  }

  const resParams = { result };
  if (!result) {
    resParams.errorData = {
      title: msgObj.title,
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
  try {
    await chrome.tabs.get(dappTabId);
  } catch (err) {
    console.error('Failed to get tab info：', err);
  }
  chrome.tabs.sendMessage(dappTabId, {
    type: 'padoZKAttestationJSSDK',
    name: 'getAttestationRes',
    params: resParams,
  });
}

/**
 * Handle getAttestationResult response: success (sucFn), or failure with error mapping (extraData / attestTipMap), or retcode '2'.
 */
export async function handleGetAttestationResult(
  message,
  storage,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const {
    padoZKAttestationJSSDKDappTabId: dappTabId,
    configMap,
    activeRequestAttestation,
    padoZKAttestationJSSDKAttestationPresetParams,
  } = storage;

  let attestTipMap = {};
  if (
    configMap &&
    JSON.parse(configMap) &&
    JSON.parse(configMap).ATTESTATION_PROCESS_NOTE
  ) {
    attestTipMap = JSON.parse(
      JSON.parse(configMap).ATTESTATION_PROCESS_NOTE
    );
  }

  if (!message.res) return;

  const { retcode, content, details, isUserClick } = JSON.parse(message.res);
  if (isUserClick !== 'true') return;

  await chrome.storage.local.set({ getAttestationResultRes: message.res });
  const parsedActiveRequestAttestation = activeRequestAttestation
    ? JSON.parse(activeRequestAttestation)
    : {};
  const activeAttestationParams = padoZKAttestationJSSDKAttestationPresetParams
    ? JSON.parse(padoZKAttestationJSSDKAttestationPresetParams)
    : {};
  const extendedParamsObj = activeAttestationParams?.extendedParams
    ? JSON.parse(activeAttestationParams.extendedParams)
    : {};
  const errorMsgTitle = await getErrorMsgTitleFn();

  const sucFn = async (resData) => {
    await pageDecodeMsgListener(
      { name: 'end', params: { result: 'success' } },
      sender,
      sendResponse,
      HAS_GET_TWITTER_SCREEN_NAME,
      processAlgorithmReq
    );
    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKWalletAddress',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'activeRequestAttestation',
    ]);
    chrome.tabs.sendMessage(dappTabId, {
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
      if (activeRequestId !== content?.requestid) return;

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
        type: 'error',
        title: errorMsgTitle,
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
        const showTip = getErrorTipByExtraData(extraDataStr);
        if (showTip) {
          msgObj.type = '';
          msgObj.desc = showTip;
          msgObj.sourcePageTip = showTip;
        }
      } else {
        if (!content?.signature && content?.encodedData) {
          errorCode = '00103';
          Object.assign(msgObj, attestTipMap[errorCode] || {});
          msgObj.sourcePageTip = (attestTipMap[errorCode] || {}).title ?? msgObj.sourcePageTip;
        } else if (
          activeAttestationParams?.verificationContent === 'Assets Proof' &&
          activeAttestationParams?.dataSourceId === 'binance'
        ) {
          errorCode = '00102';
          Object.assign(msgObj, {
            type: attestTipMap['00102']?.type,
            desc: attestTipMap['00102']?.desc,
            sourcePageTip: attestTipMap['00102']?.title ?? msgObj.sourcePageTip,
          });
        } else {
          errorCode = '00104';
          Object.assign(msgObj, {
            type: attestTipMap['00104']?.type,
            desc: attestTipMap['00104']?.desc,
            sourcePageTip: attestTipMap['00104']?.title ?? msgObj.sourcePageTip,
          });
        }
      }

      await pageDecodeMsgListener(
        {
          name: 'end',
          params: { result: 'warn', failReason: { ...msgObj } },
        },
        sender,
        sendResponse,
        HAS_GET_TWITTER_SCREEN_NAME,
        processAlgorithmReq
      );
      await chrome.storage.local.remove([
        'padoZKAttestationJSSDKBeginAttest',
        'padoZKAttestationJSSDKWalletAddress',
        'padoZKAttestationJSSDKAttestationPresetParams',
        'activeRequestAttestation',
      ]);
      const resParams = {
        result: false,
        errorData: { title: msgObj.title, desc: msgObj.desc, code: errorCode },
      };
      chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: resParams,
      });
    }
  } else if (retcode === '2') {
    const { errlog: { code } = {} } = details || {};
    processAlgorithmReq({ reqMethodName: 'stop' });
    const msgObj = getAttestTipForCode(code, attestTipMap);
    msgObj.title = errorMsgTitle;

    await pageDecodeMsgListener(
      {
        name: 'end',
        params: { result: 'warn', failReason: { ...msgObj } },
      },
      sender,
      sendResponse,
      HAS_GET_TWITTER_SCREEN_NAME,
      processAlgorithmReq
    );
    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKWalletAddress',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'activeRequestAttestation',
    ]);
    const resParams = {
      result: false,
      errorData: {
        title: msgObj.title,
        desc: msgObj.desc,
        code: code,
        data: message.res,
      },
      reStartFlag: true,
    };
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: resParams,
    });
  } else {
    await chrome.storage.local.set({
      attestationLogInQuery: message.res,
    });
  }
}
