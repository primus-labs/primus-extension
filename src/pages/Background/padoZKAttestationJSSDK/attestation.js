/**
 * Start attestation flow: build template from API, run pageDecode init; result and timeout handlers.
 */
import { v4 as uuidv4 } from 'uuid';
import { queryTemplateById } from '@/services/api/devconsole';
import { pageDecodeMsgListener } from '../pageDecode/index.js';
import { getAlgoApi } from './utils';
import { STARTOFFLINETIMEOUT } from '@/config/constants';
import { getErrorMsgTitleFn } from '../utils/handleError.js';
import { getSdkState, setProcessAlgorithmReqRef, getProcessAlgorithmReqRef } from './init.js';

/**
 * Handle startAttestation: validate params, load template, build request/response templates, start offline, call pageDecode init.
 */
export async function handleStartAttestation(
  params,
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const state = getSdkState();
  state.sdkVersion = params?.sdkVersion;
  state.sdkName = params?.sdkName;
  state.isNetworkSdk = !!(state.sdkName && state.sdkName.indexOf('network') > -1);
  state.sdkParams = params;

  console.log(
    'debuge-zktls-startAttestation',
    state.sdkVersion,
    'time:',
    new Date().toLocaleString(),
    'params',
    JSON.stringify(params)
  );

  await chrome.storage.local.set({
    padoZKAttestationJSSDKBeginAttest: state.sdkVersion,
  });
  processAlgorithmReq({ reqMethodName: 'start' });

  const {
    activeRequestAttestation: lastActiveRequestAttestationStr,
    padoZKAttestationJSSDKDappTabId: dappTabId,
  } = await chrome.storage.local.get([
    'activeRequestAttestation',
    'padoZKAttestationJSSDKDappTabId',
  ]);

  if (lastActiveRequestAttestationStr) {
    await chrome.storage.local.remove(['padoZKAttestationJSSDKBeginAttest']);
    const resParams = {
      result: false,
      errorData: {
        title: '',
        desc:
          'An attestation process is currently being generated. Please try again later.',
        code: '00003',
      },
    };
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: resParams,
    });
    return;
  }

  let activeWebProofTemplate = {};
  let activeAttestationParams = {};
  const requestid = uuidv4();
  const chainName = params.chainName;
  let walletAddress;
  let algorithmType = state.sdkVersion
    ? params.attRequest?.attMode?.algorithmType || 'proxytls'
    : undefined;

  const algoApisParam = state.isNetworkSdk ? params.attRequest?.algoApis : undefined;

  if (state.isNetworkSdk && !params.attRequest?.algoApis?.[0]) {
    console.log('network-sdk params error');
    const resParams = {
      result: false,
      errorData: {
        title: 'Invalid Algorithm Parameters',
        desc: 'Invalid Algorithm Parameters',
        code: '00015',
      },
    };
    const { padoZKAttestationJSSDKDappTabId: dappTabIdErr } =
      await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
    chrome.tabs.sendMessage(dappTabIdErr, {
      type: 'padoZKAttestationJSSDK',
      name: 'getAttestationRes',
      params: resParams,
    });
    return;
  }

  const padoUrlKey = algorithmType === 'proxytls' ? 'zkPadoUrl' : 'padoUrl';
  const padoUrl = await getAlgoApi(padoUrlKey, algoApisParam);
  const proxyUrl = await getAlgoApi('proxyUrl', algoApisParam);

  chrome.runtime.sendMessage({
    type: 'algorithm',
    method: 'startOffline',
    params: { offlineTimeout: STARTOFFLINETIMEOUT, padoUrl, proxyUrl },
  });

  if (state.sdkVersion) {
    const {
      attRequest: { attTemplateID, userAddress },
      appSignature,
    } = params;
    walletAddress = userAddress;

    try {
      const { rc, result } = await queryTemplateById(attTemplateID);
      if (rc === 0 && result) {
        const {
          id,
          name,
          description,
          category,
          dataSource,
          dataPageTemplate,
          dataSourceTemplate,
          sslCipherSuite,
        } = result;

        const dataSourceTemplateObj = JSON.parse(dataSourceTemplate);
        let jumpTo = JSON.parse(dataPageTemplate).baseUrl;
        const additionParams = params.attRequest?.additionParams;
        let additionParamsObj = {};
        if (additionParams) {
          try {
            additionParamsObj = JSON.parse(additionParams);
            if (additionParamsObj.launch_page) {
              jumpTo = additionParamsObj.launch_page;
            }
          } catch (err) {
            console.log(
              'Invalid json string ,additionParamsObj.launch_page err',
              err
            );
          }
        }
        const host =
          dataSourceTemplateObj[0]?.requestTemplate?.host ||
          new URL(jumpTo).host;
        const newRequests = dataSourceTemplateObj.reduce((prev, curr, idx) => {
          const {
            requestTemplate: {
              targetUrlExpression,
              targetUrlType,
              method,
              matchReqBodyKey,
              ignoreResponse,
            },
          } = curr;
          prev.push({
            name: `sdk-${idx}`,
            url: targetUrlExpression,
            urlType: targetUrlType,
            method,
            matchReqBodyKey,
            ignoreResponse,
          });
          return prev;
        }, []);

        const newResponses = dataSourceTemplateObj.reduce((prev, curr, currIdx) => {
          const { responseTemplate } = curr;
          const subconditions = responseTemplate.reduce((prevS, currS) => {
            const {
              resolver: { expression },
              feilds: [{ key }],
            } = currS;
            let subconditionItem = { field: expression };
            const subItemCondition = params.attRequest?.attConditions?.[currIdx]?.find(
              (i) => {
                if (i.op === 'MATCH_ONE') return i.key === key;
                return i.field === key;
              }
            );
            const handleREVEALFn = () => {
              subconditionItem.op = 'REVEAL_STRING';
              subconditionItem.type = 'FIELD_REVEAL';
              subconditionItem.reveal_id = key;
            };
            const handleNoneComputeFn = () => {
              subconditionItem.op = 'NONE';
              subconditionItem.type = 'FIELD_VALUE';
            };
            const computeMode = params.attRequest?.computeMode;
            if (
              computeMode === 'nonecomplete' ||
              computeMode === 'nonepartial'
            ) {
              handleNoneComputeFn();
            } else if (subItemCondition) {
              const { op, value, field, type } = subItemCondition;
              subconditionItem.op = op;
              if (
                ['>', '>=', '=', '!=', '<', '<=', 'STREQ', 'STRNEQ'].includes(op)
              ) {
                subconditionItem.type = 'FIELD_RANGE';
                subconditionItem.value = value;
              } else if (['SHA256'].includes(op)) {
                subconditionItem.type = 'FIELD_VALUE';
                subconditionItem.reveal_id = key;
              } else if (['SHA256_EX', 'REVEAL_HEX_STRING'].includes(op)) {
                subconditionItem.type = 'FIELD_REVEAL';
                subconditionItem.op = 'REVEAL_HEX_STRING';
                subconditionItem.reveal_id = key;
                subconditionItem.field = {
                  type: 'FIELD_ARITHMETIC',
                  op: 'SHA256',
                  field: subconditionItem.field,
                };
              } else if (op === 'REVEAL_STRING') {
                handleREVEALFn();
              } else if (op === 'MATCH_ONE') {
                subconditionItem = { type, op, field, subconditions: value };
              }
            } else {
              handleREVEALFn();
            }
            prevS.push(subconditionItem);
            return prevS;
          }, []);
          prev.push({
            conditions: {
              type: 'CONDITION_EXPANSION',
              op: 'BOOLEAN_AND',
              subconditions,
            },
          });
          return prev;
        }, []);

        activeWebProofTemplate = {
          id,
          name,
          category,
          description,
          dataSource,
          jumpTo,
          datasourceTemplate: {
            host,
            requests: newRequests,
            responses: newResponses,
            calculations: undefined,
          },
          sslCipherSuite,
        };
        activeAttestationParams = {
          dataSourceId: dataSource,
          verificationContent: name,
          verificationValue: description,
          fetchType: 'Web',
          attestOrigin: params.attRequest?.appId || state.sdkVersion,
          account: '',
          attestationType: category,
          requestid,
          algorithmType:
            params.attRequest?.attMode?.algorithmType || 'proxytls',
          sdkVersion: state.sdkVersion,
          ext: {
            appSignParameters: JSON.stringify(params.attRequest),
            appSignature,
            padoUrl,
            proxyUrl,
          },
          attTemplateID,
          extendedParams: params.attRequest?.extendedParams,
          additionParamsObj,
          allJsonResponseFlag: params.attRequest?.allJsonResponseFlag,
          clientType: state.sdkName,
        };
      } else {
        await sendTemplateErrorToDapp('00012');
        return;
      }
    } catch (e) {
      console.log('sdk template error:', e);
      await sendTemplateErrorToDapp('00012');
      return;
    }
  }

  await chrome.storage.local.set({
    padoZKAttestationJSSDKWalletAddress: walletAddress,
  });
  console.log('debuge-zktls-startAttestation2', walletAddress);
  await chrome.storage.local.remove(['beginAttest', 'getAttestationResultRes']);
  await chrome.storage.local.set({
    padoZKAttestationJSSDKAttestationPresetParams: JSON.stringify(
      Object.assign({ chainName }, activeAttestationParams)
    ),
  });

  const currRequestTemplate = {
    ...activeAttestationParams,
    ...activeWebProofTemplate,
  };
  await pageDecodeMsgListener(
    {
      type: 'pageDecode',
      name: 'init',
      params: { ...currRequestTemplate, requestid },
      operation: 'attest',
    },
    sender,
    sendResponse,
    state.hasGetTwitterScreenName,
    processAlgorithmReq
  );
}

async function sendTemplateErrorToDapp(code) {
  const resParams = {
    result: false,
    errorData: {
      title: 'Invalid Template ID.',
      desc: 'Invalid Template ID.',
      code,
    },
  };
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
  chrome.tabs.sendMessage(dappTabId, {
    type: 'padoZKAttestationJSSDK',
    name: 'getAttestationRes',
    params: resParams,
  });
}

/** Handle getAttestationResult: forward to algorithm. */
export function handleGetAttestationResult(processAlgorithmReq) {
  processAlgorithmReq({
    reqMethodName: 'getAttestationResult',
    params: {},
  });
}

/**
 * Handle getAttestationResultTimeout: report timeout, end pageDecode, stop algorithm, send result to dapp.
 */
export async function handleGetAttestationResultTimeout(
  sender,
  sendResponse,
  processAlgorithmReq
) {
  const state = getSdkState();
  const { configMap } = await chrome.storage.local.get(['configMap']);
  let attestTipMap = {};
  if (
    configMap &&
    JSON.parse(configMap) &&
    JSON.parse(configMap).ATTESTATION_PROCESS_NOTE
  ) {
    attestTipMap = JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE);
  }
  const errorMsgTitle = await getErrorMsgTitleFn();
  const code = '00002';
  const msgObj = {
    type: attestTipMap[code]?.type,
    title: errorMsgTitle,
    desc: attestTipMap[code]?.desc,
    sourcePageTip: attestTipMap[code]?.title,
  };

  await chrome.storage.local.remove([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKWalletAddress',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'activeRequestAttestation',
  ]);

  await pageDecodeMsgListener(
    {
      name: 'end',
      params: { result: 'warn', failReason: { ...msgObj } },
    },
    sender,
    sendResponse,
    state.hasGetTwitterScreenName,
    processAlgorithmReq
  );
  processAlgorithmReq({ reqMethodName: 'stop' });

  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
  const { attestationLogInQuery } = await chrome.storage.local.get([
    'attestationLogInQuery',
  ]);
  const resParams = {
    result: false,
    errorData: {
      title: msgObj.title,
      desc: msgObj.desc,
      code,
      data: attestationLogInQuery || JSON.stringify({}),
    },
    reStartFlag: true,
  };
  chrome.tabs.sendMessage(dappTabId, {
    type: 'padoZKAttestationJSSDK',
    name: 'startAttestationRes',
    params: resParams,
  });
}

/** Called when dapp tab is closed during attestation; cancel pageDecode. */
export async function handleDappTabRemoved(tabId) {
  const processAlgorithmReq = getProcessAlgorithmReqRef();
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKDappTabId: dappTabId,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
  ]);
  if (tabId === dappTabId && padoZKAttestationJSSDKBeginAttest) {
    await pageDecodeMsgListener(
      { type: 'pageDecode', name: 'cancel' },
      {},
      () => {},
      getSdkState().hasGetTwitterScreenName,
      processAlgorithmReq
    );
  }
}
