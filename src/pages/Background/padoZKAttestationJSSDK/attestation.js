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
import {
  completePendingSdkInitialization,
  getSdkState,
  getProcessAlgorithmReqRef,
} from './init.js';
import { safeStorageGet, safeStorageSet } from '@/utils/safeStorage';
import { sendMsgToTab } from '../utils/utils.js';
import { safeJsonParse, parseAlgorithmReportData } from '@/utils/utils';
import { stopKeepAlive } from '../utils/keepAlive.js';
import { resolveNoteV2MapFromConfigParsed } from '@/utils/attestationProcessNoteV2';
import { getAttestTipForCode } from '../algorithm/errorMap.js';
import {
  ERROR_UNKNOWN,
  ERROR_UNKNOWN_SUB_PRE_ALGORITHM,
  ERROR_DATA_SOURCE_TAB_ERROR_PAGE,
} from '@/config/errorCodes';
import {
  TEMPLATE_ID_FOR_LUMA_MONAD,
  MONAD_CALCULATIONS,
} from '../pageDecode/specialTemplates/lumaMonad/constants';
import {
  clearSdkAttestationResultCache,
  clearSdkAttestationRuntimeState,
  clearSdkAttestationRuntimeStateUnlocked,
  getSdkAttestationSession,
  getSdkInitializationSession,
  removeSdkInitializationSession,
  setSdkAttestationSession,
  setSdkAttestationPreset,
} from './sessionStorage.js';
import { createTabMessageSender } from '../utils/msgTransfer.js';
import { cleanupPageDecodeWithoutCancel } from '../pageDecode/closeDataSourceTab.js';
import {
  buildProofCleanupSnapshot,
  claimSdkProofOwnership,
  isSameProofCleanupSnapshot,
  shouldRemoveSdkInitializationForUrl,
  withSdkInitializationLock,
  withSdkProofOwnershipLock,
} from './sessionLifecycle.js';
import {
  buildAggregateSubcondition,
  JSON_PATH_EVALUATION_KEY,
  RANGE_OPERATORS,
  VALIDATION_JSON_PATH_KEY,
} from './buildAggregateSubcondition.js';
import {
  DEFAULT_REVEAL_TYPE,
  getDefaultRevealOpForResponseValueType,
  isStreamResponseValueType,
  responseTemplateIndicatesStream,
  STREAM_REVEAL_OP,
} from '../pageDecode/streamTemplate.js';

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
  await clearSdkAttestationRuntimeState();
}

async function cleanupStaleActiveAttestationState() {
  await clearSdkAttestationRuntimeStateUnlocked();
}

async function cleanupAbortedStartAttestationState(afterClear) {
  await clearSdkAttestationRuntimeState(afterClear);
}

/** Chrome scripting API when the main frame shows an interstitial / network error page. */
function isChromeMainFrameErrorPageInjectFailure(err) {
  const msg =
    err != null && typeof err === 'object' && err.message != null
      ? String(err.message)
      : err != null
        ? String(err)
        : '';
  return /Frame with ID \d+ is showing error page/i.test(msg);
}

/**
 * @param {string | undefined} [unknown99999SubCode] - details.subCode when code is ERROR_UNKNOWN (pre-algorithm only)
 */
async function sendStartAttestationResolvedError(
  sendToSdk,
  code,
  unknown99999SubCode
) {
  const { configMap } = await safeStorageGet(['configMap']);
  const noteV2Map = resolveNoteV2MapFromConfigParsed(safeJsonParse(configMap));
  const tipLookupKey =
    code === ERROR_UNKNOWN && unknown99999SubCode
      ? `${ERROR_UNKNOWN}:${unknown99999SubCode}`
      : code;
  const tip = getAttestTipForCode(tipLookupKey, noteV2Map);
  const errorData = {
    desc: tip.desc,
    code,
    ...(code === ERROR_UNKNOWN &&
    unknown99999SubCode &&
    typeof unknown99999SubCode === 'string'
      ? { details: { subCode: unknown99999SubCode } }
      : {}),
  };
  await sendToSdk({
    type: 'padoZKAttestationJSSDK',
    name: 'startAttestationRes',
    params: {
      result: false,
      errorData,
      reStartFlag: true,
    },
  });
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
  const sendToSdk = createTabMessageSender(currentDappTabId);
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

  const initializedSession = await getSdkInitializationSession(
    currentDappTabId
  );
  const beginAttestFlag = initializedSession?.sdkVersion;
  const claimed = await claimSdkProofOwnership({
    getState: async () => {
      const storage = await safeStorageGet([
        SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
        SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
        'activeRequestAttestation',
      ]);
      return {
        lockTabId: storage[SDK_START_ATTESTATION_LOCK_TAB_ID_KEY],
        lockStartedAt:
          storage[SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY],
        activeRequestAttestation: storage.activeRequestAttestation,
      };
    },
    clearStale: cleanupStaleActiveAttestationState,
    setOwner: async () => {
      await setSdkAttestationSession({
        ...initializedSession,
        ownerTabId: currentDappTabId,
        clientType:
          params?.clientType || initializedSession?.clientType || '',
        sdkVersion:
          params?.sdkVersion || initializedSession?.sdkVersion || '',
        sdkName: params?.sdkName || initializedSession?.sdkName || '',
        active: true,
      });
      await safeStorageSet({
        [SDK_START_ATTESTATION_LOCK_TAB_ID_KEY]: currentDappTabId,
        [SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY]: Date.now(),
      });
    },
    now: Date.now,
    staleTtlMs: activeRequestStaleTtlMs,
  });
  if (!claimed) {
    await sendBusyStartAttestationResponse(currentDappTabId);
    return;
  }

  try {
    state.sdkVersion = params?.sdkVersion || beginAttestFlag;
    state.sdkName = params?.sdkName || initializedSession?.sdkName;
    state.isNetworkSdk = !!(state.sdkName && state.sdkName.indexOf('network') > -1);
    state.sdkParams = params;

    await processAlgorithmReq({
      reqMethodName: 'start',
      params: { ensureAlgorithmInit: true },
    });

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
      await sendToSdk({
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
              requireReplayValidation,
              needCapture,
            },
            responseTemplate,
          } = curr;
          const isStream = responseTemplateIndicatesStream(responseTemplate);
          prev.push({
            name: `sdk-${idx}`,
            url: targetUrlExpression,
            urlType: targetUrlType,
            method,
            matchReqBodyKey,
            ignoreResponse,
            requireReplayValidation,
            needCapture,
            ...(isStream ? { isStream: true } : {}),
          });
          return prev;
        }, []);

        const newResponses = dataSourceTemplateObj.reduce((prev, curr, currIdx) => {
          const { responseTemplate } = curr;
          const plaintext_outputs = [];
          const subconditions = responseTemplate.reduce((prevS, currS) => {
            const {
              resolver: { expression },
              feilds,
              plaintext,
              valueType,
            } = currS;
            const isStreamResponse = isStreamResponseValueType(valueType);
            const feildsList = Array.isArray(feilds) ? feilds : [];
            const defaultFeild = feildsList[0];
            const subItemCondition = params.attRequest?.attConditions?.[
              currIdx
            ]?.find((i) => {
              if (i.op === 'MATCH_ONE') {
                return feildsList.some((f) => f.key === i.key);
              }
              return feildsList.some((f) => f.key === i.field);
            });
            const matchKey = subItemCondition
              ? subItemCondition.op === 'MATCH_ONE'
                ? subItemCondition.key
                : subItemCondition.field
              : undefined;
            const feildEntry =
              matchKey != null
                ? feildsList.find((f) => f.key === matchKey) ?? defaultFeild
                : defaultFeild;
            const key = feildEntry?.key ?? defaultFeild?.key;
            if (!key) {
              return prevS;
            }
            if (plaintext === 'true') {
              plaintext_outputs.push({
                id: `${String(key)}_plain`,
                field: expression,
              });
            }
            let subconditionItem = { field: expression };
            const handleREVEALFn = () => {
              subconditionItem.op =
                getDefaultRevealOpForResponseValueType(valueType);
              subconditionItem.type = DEFAULT_REVEAL_TYPE;
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
              const hasAggregateOp =
                subItemCondition.aggregateOp != null &&
                subItemCondition.aggregateOp !== '';
              if (hasAggregateOp) {
                const built = buildAggregateSubcondition(
                  subItemCondition,
                  { expression, feildEntry },
                  key
                );
                if (built) {
                  subconditionItem = built;
                } else {
                  console.log(
                    '[attestation] invalid aggregateOp, fallback REVEAL_STRING',
                    subItemCondition.aggregateOp
                  );
                  handleREVEALFn();
                }
              } else {
                const { op, value, field, type } = subItemCondition;
                subconditionItem.op = op;
                if (RANGE_OPERATORS.includes(op)) {
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
              }
            } else {
              handleREVEALFn();
            }
            const hasTemplateAggregation = feildsList.some(
              (f) => f?.aggregation && typeof f.aggregation === 'object'
            );
            if (
              !isStreamResponse &&
              hasTemplateAggregation &&
              typeof expression === 'string' &&
              expression.trim()
            ) {
              subconditionItem[VALIDATION_JSON_PATH_KEY] = expression.trim();
            }
            if (isStreamResponse) {
              subconditionItem.type = DEFAULT_REVEAL_TYPE;
              subconditionItem.op = STREAM_REVEAL_OP;
              if (key != null && key !== '') {
                subconditionItem.reveal_id = key;
              }
            }
            const fieldJsonPathEval = feildEntry?.jsonPathEvaluation;
            if (fieldJsonPathEval?.truncateUnreachable === true) {
              subconditionItem[JSON_PATH_EVALUATION_KEY] = {
                truncateUnreachable: true,
              };
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
          await sendTemplateErrorToDapp('00012', sendToSdk);
          return;
        }
      } catch (e) {
        console.log('sdk template error:', e);
        await cleanupStartAttestationState();
        await sendTemplateErrorToDapp('00012', sendToSdk);
        return;
      }
    }

    console.log('debuge-zktls-startAttestation2', walletAddress);
    await clearSdkAttestationResultCache();
    await setSdkAttestationPreset(Object.assign({ chainName }, activeAttestationParams));

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
  } catch (e) {
    console.log('startAttestation unexpected error:', e);
    stopKeepAlive();
    await cleanupPageDecodeWithoutCancel();
    try {
      await cleanupAbortedStartAttestationState(() =>
        processAlgorithmReq({
          reqMethodName: 'stop',
          params: { noRestart: true },
        })
      );
    } catch (_stopErr) {
      // Best-effort cleanup; primary goal is to release the lock and notify the dapp.
    }
    const code = isChromeMainFrameErrorPageInjectFailure(e)
      ? ERROR_DATA_SOURCE_TAB_ERROR_PAGE
      : ERROR_UNKNOWN;
    await sendStartAttestationResolvedError(
      sendToSdk,
      code,
      code === ERROR_UNKNOWN ? ERROR_UNKNOWN_SUB_PRE_ALGORITHM : undefined
    );
  }
}

async function sendTemplateErrorToDapp(code, sendToSdk) {
  const resParams = {
    result: false,
    errorData: {
      desc: 'Invalid Template ID.',
      code,
    },
  };
  await sendToSdk({
    type: 'padoZKAttestationJSSDK',
    name: 'getAttestationRes',
    params: resParams,
  });
}

/** Handle getAttestationResult: forward to algorithm. */
export async function handleGetAttestationResult(processAlgorithmReq) {
  const { activeRequestAttestation } = await safeStorageGet([
    'activeRequestAttestation',
  ]);
  const activeRequest =
    safeJsonParse(activeRequestAttestation, {}) || {};
  processAlgorithmReq({
    reqMethodName: 'getAttestationResult',
    params: { requestid: activeRequest.requestid },
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
  const session = await getSdkAttestationSession();
  const sendToSdk = createTabMessageSender(session?.ownerTabId);
  const { configMap, attestationLogInQuery } = await safeStorageGet([
    'configMap',
    'attestationLogInQuery',
  ]);
  const configMapParsed = safeJsonParse(configMap);
  const noteV2Map = resolveNoteV2MapFromConfigParsed(configMapParsed);
  const code = '00002';
  const tip = getAttestTipForCode(code, noteV2Map);
  const msgObj = {
    desc: tip.desc,
    sourcePageTip: tip.sourcePageTip,
  };

  stopKeepAlive();
  await clearSdkAttestationRuntimeState(async () => {
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
    await processAlgorithmReq({
      reqMethodName: 'stop',
      params: { noRestart: true },
    });
  });
  const resParams = {
    result: false,
    errorData: {
      desc: msgObj.desc,
      code,
      data: parseAlgorithmReportData(attestationLogInQuery),
    },
    reStartFlag: true,
  };
  await sendToSdk({
    type: 'padoZKAttestationJSSDK',
    name: 'startAttestationRes',
    params: resParams,
  });
}

/** Called when dapp tab is closed during attestation; cancel pageDecode. */
export async function handleDappTabRemoved(tabId) {
  await withSdkInitializationLock(() =>
    removeSdkInitializationSession(tabId)
  );
  completePendingSdkInitialization(tabId);
  await cleanupActiveDappTab(tabId);
}

async function readProofCleanupSnapshot(tabId) {
  const session = await getSdkAttestationSession();
  const storage = await safeStorageGet([
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
    'activeRequestAttestation',
  ]);
  return buildProofCleanupSnapshot(tabId, session, storage);
}

async function finalizeTabCleanupIfUnchanged(tabId, snapshot) {
  await withSdkProofOwnershipLock(async () => {
    const current = await readProofCleanupSnapshot(tabId);
    if (!isSameProofCleanupSnapshot(snapshot, current)) return;
    await clearSdkAttestationRuntimeStateUnlocked();
  });
}

async function cleanupActiveDappTab(tabId) {
  const processAlgorithmReq = getProcessAlgorithmReqRef();

  const snapshot = await withSdkProofOwnershipLock(() =>
    readProofCleanupSnapshot(tabId)
  );
  if (!snapshot) return;

  const hasActiveProof =
    snapshot.lockTabId != null || snapshot.activeRequestId != null;

  if (hasActiveProof && snapshot.sdkVersion) {
    await pageDecodeMsgListener(
      { type: 'pageDecode', name: 'cancel' },
      {},
      () => {},
      getSdkState().hasGetTwitterScreenName,
      processAlgorithmReq
    );
    await finalizeTabCleanupIfUnchanged(tabId, snapshot);
    return;
  }

  if (!hasActiveProof && snapshot.sessionActive && processAlgorithmReq) {
    try {
      await processAlgorithmReq({
        reqMethodName: 'stop',
        params: { noRestart: true },
      });
    } catch (error) {
      console.log('owner tab removed stop error', error);
    }
  }

  await finalizeTabCleanupIfUnchanged(tabId, snapshot);
}

export async function handleDappTabNavigated(tabId, nextUrl) {
  const removed = await withSdkInitializationLock(async () => {
    const initializedSession = await getSdkInitializationSession(tabId);
    if (!shouldRemoveSdkInitializationForUrl(initializedSession, nextUrl)) {
      return false;
    }
    await removeSdkInitializationSession(tabId);
    completePendingSdkInitialization(tabId);
    return true;
  });
  if (removed) await cleanupActiveDappTab(tabId);
}
