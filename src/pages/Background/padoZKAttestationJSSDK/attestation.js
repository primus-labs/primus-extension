/**
 * Start attestation flow: build template from API, run pageDecode init; result and timeout handlers.
 */
import { v4 as uuidv4 } from 'uuid';
import { queryTemplateById } from '@/services/api/devconsole';
import { pageDecodeMsgListener } from '../pageDecode/index.js';
import { getAlgoApi } from './utils';
import {
  STARTOFFLINETIMEOUT,
  DEFAULT_PAGE_DECODE_VERIFY_MS,
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
} from '@/config/constants';
import { getSdkState, getProcessAlgorithmReqRef } from './init.js';
import { safeStorageGet, safeStorageSet, safeStorageRemove } from '@/utils/safeStorage';
import { sendMsgToTab } from '../utils/utils.js';
import { safeJsonParse } from '@/utils/utils';
import { stopKeepAlive } from '../utils/keepAlive.js';
import { resolveNoteV2MapFromConfigParsed } from '@/utils/attestationProcessNoteV2';
import { getAttestTipForCode } from '../algorithm/errorMap.js';
import {
  TEMPLATE_ID_FOR_LUMA_MONAD,
  MONAD_CALCULATIONS,
} from '../pageDecode/specialTemplates/lumaMonad/constants';

const ACTIVE_REQUEST_STALE_GRACE_MS = 60 * 1000;

/** `attRequest.timeout` in milliseconds; invalid or missing → 2 minutes. */
function resolvePageDecodeVerifyTimeoutMs(attRequest) {
  const raw = attRequest?.timeout;
  if (raw == null || raw === '') return DEFAULT_PAGE_DECODE_VERIFY_MS;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_DECODE_VERIFY_MS;
  return Math.round(n);
}

async function cleanupStartAttestationState() {
  await safeStorageRemove([
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKClientType',
  ]);
}

async function cleanupStaleActiveAttestationState() {
  await safeStorageRemove([
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKWalletAddress',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'activeRequestAttestation',
    'padoZKAttestationJSSDKClientType',
    'beginAttest',
    'getAttestationResultRes',
  ]);
}

async function sendBusyStartAttestationResponse(targetTabId) {
  if (targetTabId == null) return;
  await sendMsgToTab(targetTabId, {
    type: 'padoZKAttestationJSSDK',
    name: 'startAttestationRes',
    params: {
      result: false,
      errorData: {
        desc:
          'An attestation process is currently being generated. Please try again later.',
        code: '00003',
      },
    },
  });
}

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
  const currentDappTabId = sender?.tab?.id;
  const pageDecodeVerifyTimeoutMs = resolvePageDecodeVerifyTimeoutMs(
    params?.attRequest
  );
  const activeRequestStaleTtlMs =
    pageDecodeVerifyTimeoutMs + ACTIVE_REQUEST_STALE_GRACE_MS;

  console.log(
    'debuge-zktls-startAttestation',
    state.sdkVersion,
    'time:',
    new Date().toLocaleString(),
    'params',
    JSON.stringify(params)
  );

  const {
    [SDK_START_ATTESTATION_LOCK_TAB_ID_KEY]: startAttestationLockTabId,
    [SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY]: startAttestationLockStartedAt,
    activeRequestAttestation: lastActiveRequestAttestationStr,
    padoZKAttestationJSSDKBeginAttest: beginAttestFlag,
  } = await safeStorageGet([
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
    'activeRequestAttestation',
    'padoZKAttestationJSSDKBeginAttest',
  ]);

  if (startAttestationLockTabId != null) {
    const startedAt = Number(startAttestationLockStartedAt);
    const hasValidStartedAt = Number.isFinite(startedAt);
    const isStaleLock =
      !hasValidStartedAt || Date.now() - startedAt > activeRequestStaleTtlMs;

    if (isStaleLock) {
      console.log(
        'debuge-zktls-clear-stale-startAttestation-lock',
        JSON.stringify({
          startedAt: hasValidStartedAt ? startedAt : null,
          ownerTabId: startAttestationLockTabId,
        })
      );
      await cleanupStaleActiveAttestationState();
    } else {
      await sendBusyStartAttestationResponse(currentDappTabId);
      return;
    }
  }

  if (lastActiveRequestAttestationStr) {
    const startedAt = Number(startAttestationLockStartedAt);
    const hasValidStartedAt = Number.isFinite(startedAt);
    const isStaleLock =
      !beginAttestFlag ||
      !hasValidStartedAt ||
      Date.now() - startedAt > activeRequestStaleTtlMs;

    if (isStaleLock) {
      console.log(
        'debuge-zktls-clear-stale-activeRequestAttestation',
        JSON.stringify({
          hasBeginAttest: !!beginAttestFlag,
          startedAt: hasValidStartedAt ? startedAt : null,
        })
      );
      await cleanupStaleActiveAttestationState();
    } else {
      await sendBusyStartAttestationResponse(currentDappTabId);
      return;
    }
  }

  state.sdkVersion = params?.sdkVersion;
  state.sdkName = params?.sdkName;
  state.isNetworkSdk = !!(state.sdkName && state.sdkName.indexOf('network') > -1);
  state.sdkParams = params;

  await safeStorageSet({
    [SDK_START_ATTESTATION_LOCK_TAB_ID_KEY]: currentDappTabId,
    [SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY]: Date.now(),
    padoZKAttestationJSSDKDappTabId: currentDappTabId,
    padoZKAttestationJSSDKBeginAttest: state.sdkVersion,
    padoZKAttestationJSSDKClientType: params?.clientType || '',
  });
  processAlgorithmReq({ reqMethodName: 'start' });

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
    await cleanupStartAttestationState();
    const resParams = {
      result: false,
      errorData: {
        desc: 'Invalid Algorithm Parameters',
        code: '00015',
      },
    };
    const { padoZKAttestationJSSDKDappTabId: dappTabIdErr } =
      await safeStorageGet(['padoZKAttestationJSSDKDappTabId']);
    await sendMsgToTab(dappTabIdErr, {
      type: 'padoZKAttestationJSSDK',
      name: 'getAttestationRes',
      params: resParams,
    });
    return;
  }

  const padoUrlKey = algorithmType === 'proxytls' ? 'zkPadoUrl' : 'padoUrl';
  const padoUrl = await getAlgoApi(padoUrlKey, algoApisParam);
  const proxyUrl = await getAlgoApi('proxyUrl', algoApisParam);

  const clientType = params?.clientType || '';
  chrome.runtime.sendMessage({
    type: 'algorithm',
    method: 'startOffline',
    params: {
      offlineTimeout: STARTOFFLINETIMEOUT,
      padoUrl,
      proxyUrl,
      clientType,
    },
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
        const dataPageTemplateObj = JSON.parse(dataPageTemplate);
        let jumpTo = dataPageTemplateObj.baseUrl;
        const jumpConfig = dataPageTemplateObj.jumpConfig ?? null;
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
              needCapture,
            },
          } = curr;
          prev.push({
            name: `sdk-${idx}`,
            url: targetUrlExpression,
            urlType: targetUrlType,
            method,
            matchReqBodyKey,
            ignoreResponse,
            needCapture,
          });
          return prev;
        }, []);

        const newResponses = dataSourceTemplateObj.reduce((prev, curr, currIdx) => {
          const { responseTemplate } = curr;
          const plaintext_outputs = [];
          const subconditions = responseTemplate.reduce((prevS, currS) => {
            const {
              resolver: { expression },
              feilds: [{ key }],
              plaintext,
            } = currS;
            if (plaintext === 'true') {
              plaintext_outputs.push({
                id: `${String(key)}_plain`,
                field: expression,
              });
            }
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
                ['>', '>=', '=', '!=', '<', '<=', 'STREQ', 'STRNEQ','STRCASEEQ', 'STRCASENEQ'].includes(op)
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
              }  else if (['SHA256_WITH_SALT'].includes(op)) {
                subconditionItem.type = 'FIELD_REVEAL';
                subconditionItem.op = 'REVEAL_SALTTED_HASH';
                subconditionItem.reveal_id = key;
                subconditionItem.field = {
                  type: 'FIELD_ARITHMETIC',
                  op,
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
            plaintext_outputs,
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
          jumpConfig,
          dataPageTemplate: dataPageTemplateObj,
          datasourceTemplate: {
            host,
            requests: newRequests,
            responses: newResponses,
            calculations:
              attTemplateID === TEMPLATE_ID_FOR_LUMA_MONAD
                ? MONAD_CALCULATIONS
                : undefined,
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
          closeDataSourceOnProofComplete:
            params.attRequest?.closeDataSourceOnProofComplete === true,
        };
      } else {
        await cleanupStartAttestationState();
        await sendTemplateErrorToDapp('00012');
        return;
      }
    } catch (e) {
      console.log('sdk template error:', e);
      await cleanupStartAttestationState();
      await sendTemplateErrorToDapp('00012');
      return;
    }
  }

  await safeStorageSet({
    padoZKAttestationJSSDKWalletAddress: walletAddress,
  });
  console.log('debuge-zktls-startAttestation2', walletAddress);
  await safeStorageRemove(['beginAttest', 'getAttestationResultRes']);
  await safeStorageSet({
    padoZKAttestationJSSDKAttestationPresetParams: JSON.stringify(
      Object.assign({ chainName }, activeAttestationParams)
    ),
  });

  const currRequestTemplate = {
    ...activeAttestationParams,
    ...activeWebProofTemplate,
    pageDecodeVerifyTimeoutMs,
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
      desc: 'Invalid Template ID.',
      code,
    },
  };
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await safeStorageGet(['padoZKAttestationJSSDKDappTabId']);
  await sendMsgToTab(dappTabId, {
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
  const { configMap } = await safeStorageGet(['configMap']);
  const configMapParsed = safeJsonParse(configMap);
  const noteV2Map = resolveNoteV2MapFromConfigParsed(configMapParsed);
  const code = '00002';
  const tip = getAttestTipForCode(code, noteV2Map);
  const msgObj = {
    desc: tip.desc,
    sourcePageTip: tip.sourcePageTip,
  };

  stopKeepAlive();
  await safeStorageRemove([
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKWalletAddress',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'activeRequestAttestation',
    'padoZKAttestationJSSDKClientType',
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

  const { padoZKAttestationJSSDKDappTabId: dappTabId, attestationLogInQuery } =
    await safeStorageGet(['padoZKAttestationJSSDKDappTabId', 'attestationLogInQuery']);
  const resParams = {
    result: false,
    errorData: {
      desc: msgObj.desc,
      code,
      data: attestationLogInQuery || JSON.stringify({}),
    },
    reStartFlag: true,
  };
  await sendMsgToTab(dappTabId, {
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
  } = await safeStorageGet([
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
