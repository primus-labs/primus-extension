/* global chrome, console, clearTimeout, setTimeout, Uint8Array, TextDecoder, URL, Promise */
/**
 * Web request interception for page decode: capture requests, match templates, signal when ready.
 */
import {
  checkIsRequiredUrl,
  isObject,
  isUrlWithQueryFn,
  mergeQueryParamsIntoUrl,
  mergeBodyParams,
  sanitizeRequestHeaders,
} from '../utils/utils';
import {
  fetchRequestDataForTemplateValidation,
  fetchRequestDataForStreamTemplateValidation,
  fetchHtmlContent,
  validateResponseCondition,
  validateHtmlResponseCondition,
  handleAttestationError,
  shouldTreatFetchedBodyAsHtmlForValidation,
  conditionSetNeedsResponse,
  conditionSetNeedsRequestBody,
  isRequestBodyRangeSubcondition,
} from './utils';
import {
  eventListUrlForMonad,
  checkTargetRequestFnForMonad,
  isLumaMonadTemplate,
} from './specialTemplates/lumaMonad';
import {
  checkTargetRequestFnForLumaPagedApproved,
  isLumaPagedApprovedTemplate,
} from './specialTemplates/lumaPagedApproved';
import {
  isReputationPhalaBinanceEarnBalanceTemplate,
  updateRequestMapFnForReputationPhalaBinanceEarnBalance,
  checkTargetRequestFnForReputationPhalaBinanceEarnBalance,
} from './specialTemplates/specialTemplateReputationPhalaBinanceEarnBalance';
import {
  isReputationPhalaCvmListTemplate,
  checkTargetRequestFnForReputationPhalaCvmList,
  PHALA_CVM_LIST_BATCH_STATUS_URL,
} from './specialTemplates/specialTemplateReputationPhala';
import {
  isChannelSubscriptionTemplate,
  formatJsonArrFnForChannelSubscription,
} from './specialTemplates/specialTemplateChannelSubscription';
import { getPageDecodeState, PAGE_DECODE_PHASES } from './state';
import { safeStorageGet, safeStorageSet } from '@/utils/safeStorage';
import { startKeepAlive } from '../utils/keepAlive.js';
import { ensureExtensionUserIdentity } from '../identityBootstrap.js';
import { getSdkAttestationSession } from '../padoZKAttestationJSSDK/sessionStorage.js';
import { formatAlgorithmParamsFn } from './templateMatcher';
import { sendMsgToDataSourcePage } from './sdkBridge';
import { resolveJsonPathForValidation } from '../padoZKAttestationJSSDK/buildAggregateSubcondition.js';
import { trySendSecondRequestWithFirstHeaders } from './specialTemplates/specialTemplateSendSecondRequest';
import { getJsonPathEvaluationOptionsForTemplate } from './specialTemplates/templateJsonPathHooks';
import {
  tryApplyJumpConfigFromResponse,
  tryJumpConfigStandaloneIntercept,
  tryJumpConfigPresenceStep,
  shouldStoreBodyForJumpConfig,
} from './jumpConfigRedirect';
import { markFirstConfiguredRequestCapturedIfNeeded } from './specialTemplates/discordInvite/index.js';
import {
  onPolymarketUsersMePutObserved,
  onPolymarketWebRequestCaptureComplete,
  matches as matchesPolymarketPnlTemplate,
  logPolymarketPnl,
  buildPolymarketFormProbeStartedMessage,
  buildPolymarketGateUiSyncMessage,
} from './specialTemplates/specialTemplatePnlPolymarket.js';
import {
  matches as matchesHyperliquidPnlTemplate,
  shouldDeferHyperliquidPortfolioValidation,
  onHyperliquidInfoRequestObserved,
  ensureHyperliquidJoinLegalCheck,
  navigateDataSourceTabToPortfolio,
  isHyperliquidInfoPost,
  rememberHyperliquidInfoUser,
  shouldSkipHyperliquidAttestationInfoReplay,
} from './specialTemplates/specialTemplatePnlHyperliquid.js';
import {
  matches as matchesLinkedInNomadTemplate,
  logLinkedInNomad,
  summarizeLinkedInNomadCapture,
  previewXPathValidationOnHtml,
} from './specialTemplates/specialTemplateLinkedinNomad.js';
import { notifyPageDecodeReadyUi } from './pageDecodeReadyUiNotify.js';
import {
  canFinalizePageDecodeReady,
  shouldIgnorePageDecodeWebRequest,
} from './requestPolicy.js';
import {
  matches as matchesGithubHomeTemplate,
  logGitHubHome,
  summarizeGithubHomeCapture,
  describeUrlMatchForRequests as describeGithubUrlMatchForRequests,
} from './specialTemplates/specialTemplateGithubHome.js';
import {
  matches as matchesGoogleEmailTemplate,
  logGoogleEmail,
  summarizeGoogleEmailCapture,
  describeUrlMatchForRequests as describeGoogleUrlMatchForRequests,
  shouldLogUrlProbeForRequest,
} from './specialTemplates/specialTemplateGoogleEmail.js';

function matchesHtmlTemplateDebug(activeTemplate) {
  return (
    matchesLinkedInNomadTemplate(activeTemplate) ||
    matchesGithubHomeTemplate(activeTemplate) ||
    matchesGoogleEmailTemplate(activeTemplate)
  );
}

/** @param {Record<string, unknown>} detail */
function logHtmlTemplateDebug(activeTemplate, event, detail = {}) {
  if (matchesLinkedInNomadTemplate(activeTemplate)) {
    logLinkedInNomad(event, detail);
  } else if (matchesGithubHomeTemplate(activeTemplate)) {
    logGitHubHome(event, detail);
  } else if (matchesGoogleEmailTemplate(activeTemplate)) {
    logGoogleEmail(event, detail);
  }
}

function describeUrlMatchForRequests(activeTemplate, requestUrl, requests) {
  if (matchesGoogleEmailTemplate(activeTemplate)) {
    return describeGoogleUrlMatchForRequests(requestUrl, requests);
  }
  return describeGithubUrlMatchForRequests(requestUrl, requests);
}

function summarizeHtmlTemplateCapture(activeTemplate, requests, requestsMap) {
  if (matchesGithubHomeTemplate(activeTemplate)) {
    return summarizeGithubHomeCapture(requests, requestsMap);
  }
  if (matchesGoogleEmailTemplate(activeTemplate)) {
    return summarizeGoogleEmailCapture(requests, requestsMap);
  }
  return summarizeLinkedInNomadCapture(requests, requestsMap);
}

function getActiveDatasourceTemplate(state, logTag) {
  const template = state?.activeTemplate?.datasourceTemplate;
  const requests = Array.isArray(template?.requests) ? template.requests : null;
  const responses = Array.isArray(template?.responses) ? template.responses : null;
  if (!requests || !responses) {
    console.log(`[${logTag}] skip: datasourceTemplate is not ready`);
    return null;
  }
  return { requests, responses };
}

function normalizeUrlForResponseMatch(url) {
  if (typeof url !== 'string' || !url) return '';
  try {
    const parsedUrl = new URL(url);
    parsedUrl.hash = '';
    return parsedUrl.toString();
  } catch {
    return url.split('#')[0];
  }
}

function isFetchedResponseForRequest(requestUrl, responseUrl) {
  if (!responseUrl) return true;
  return (
    normalizeUrlForResponseMatch(requestUrl) ===
    normalizeUrlForResponseMatch(responseUrl)
  );
}

/**
 * Check if a captured request matches the template response conditions; mark as target if so.
 */
export async function checkSDKTargetRequest(requestId, templateRequestUrl) {
  const pageDecodeState = getPageDecodeState();
  const { state, storeInRequestsMap } = pageDecodeState;
  if (shouldDeferHyperliquidPortfolioValidation(state)) {
    return;
  }
  const { requestsMap } = state;
  const activeTemplate = state.activeTemplate;
  const htmlTemplateDebug = matchesHtmlTemplateDebug(activeTemplate);
  const jsonPathEvaluationOptions =
    getJsonPathEvaluationOptionsForTemplate(activeTemplate);
  const template = getActiveDatasourceTemplate(state, 'checkSDKTargetRequest');
  if (!template) return;
  const { requests, responses } = template;

  const capturedBrowseUrlEarly = requestsMap[requestId]?.url;
  let thisRequestUrlIdx = requests.findIndex((r) => r.url === templateRequestUrl);
  if (
    thisRequestUrlIdx < 0 &&
    typeof capturedBrowseUrlEarly === 'string' &&
    capturedBrowseUrlEarly
  ) {
    thisRequestUrlIdx = requests.findIndex((r) =>
      r.needCapture !== false
        ? checkIsRequiredUrl({
            requestUrl: capturedBrowseUrlEarly,
            requiredUrl: r.url,
            urlType: r.urlType,
            queryParams: r.queryParams,
          })
        : false
    );
  }
  if (thisRequestUrlIdx < 0) {
    console.warn('[checkSDKTargetRequest] could not resolve datasource row', {
      templateRequestUrl,
      requestId,
    });
    if (htmlTemplateDebug) {
      logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:noDatasourceRow', {
        templateRequestUrl,
        requestId,
        capturedUrl: capturedBrowseUrlEarly,
      });
    }
    return;
  }
  const thisRequestObj = requests[thisRequestUrlIdx];
  const thisResponseObj = responses[thisRequestUrlIdx];
  const isStreamRequest = thisRequestObj?.isStream === true;
  const requireReplayValidation =
    thisRequestObj?.requireReplayValidation === true;
  const shouldValidateReplayOnly = thisRequestObj?.ignoreResponse === true &&
    requireReplayValidation;
  if (
    !thisRequestObj ||
    (!shouldValidateReplayOnly &&
      (!thisResponseObj?.conditions?.subconditions ||
        thisResponseObj.conditions.subconditions.length === 0))
  ) {
    console.warn(
      '[checkSDKTargetRequest] missing template slot or response.subconditions',
      { templateRequestUrl, requestId }
    );
    if (htmlTemplateDebug) {
      logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:missingSubconditions', {
        templateRequestUrl,
        requestId,
        slotIndex: thisRequestUrlIdx,
        shouldValidateReplayOnly,
        subconditionCount:
          thisResponseObj?.conditions?.subconditions?.length ?? 0,
      });
    }
    return;
  }
  const { url, urlType, queryParams, ignoreResponse } = thisRequestObj;

  const thisRequestUrlFoundFlag = Object.values(requestsMap).find(
    (v) => v.templateRequestUrl === url && v.isTarget === 1
  );

  if (thisRequestUrlFoundFlag) {
    if (htmlTemplateDebug) {
      logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:alreadyValidated', {
        templateRequestUrl,
        requestId,
      });
    }
    return;
  }

  if (ignoreResponse && !requireReplayValidation) {
    const done = Object.entries(requestsMap).some(([rid, sInfo]) => {
      if (sInfo.templateRequestUrl === url && sInfo.headers) {
        storeInRequestsMap(rid, { isTarget: 1 });
        if (htmlTemplateDebug) {
          logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:ignoreResponseMarked', {
            requestId: rid,
            templateRequestUrl,
            capturedUrl: sInfo.url,
            ignoreResponse,
            ignoreResponseStrictTrue: ignoreResponse === true,
          });
        }
        return true;
      }
      return false;
    });
    if (done) return;
    if (htmlTemplateDebug) {
      logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:ignoreResponseNotMarked', {
        templateRequestUrl,
        slotUrl: url,
        ignoreResponse,
        ignoreResponseStrictTrue: ignoreResponse === true,
        requireReplayValidation,
      });
    }
  }

  const matchRequestIdArr = Object.keys(requestsMap).filter((key) =>
    checkIsRequiredUrl({
      requestUrl: requestsMap[key].url,
      requiredUrl: url,
      urlType: urlType || 'REGX',
      queryParams,
    })
  );

  if (htmlTemplateDebug) {
    logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:entry', {
      requestId,
      templateRequestUrl,
      slotIndex: thisRequestUrlIdx,
      templateSlotUrl: url,
      urlType: urlType || 'REGX',
      matchRequestIdArr,
      validationExpressions: shouldValidateReplayOnly
        ? []
        : (thisResponseObj.conditions?.subconditions || []).map((i) =>
            resolveJsonPathForValidation(i)
          ),
    });
    if (matchRequestIdArr.length === 0) {
      logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:noCaptureForSlot', {
        templateRequestUrl,
        requiredUrl: url,
        urlType: urlType || 'REGX',
        requestsMapSummary: Object.entries(requestsMap).map(([rid, info]) => ({
          requestId: rid,
          url: info?.url,
          templateRequestUrl: info?.templateRequestUrl,
          isTarget: info?.isTarget,
          type: info?.type,
        })),
      });
    }
  }

  for (const matchRequestId of matchRequestIdArr) {
    if (requestsMap[matchRequestId]?.isTarget === 1) break;
    if (requestsMap[matchRequestId]?.isTarget === 2) continue;

    if (matchesHyperliquidPnlTemplate(activeTemplate)) {
      const capturedBody = requestsMap[matchRequestId]?.body;
      if (shouldSkipHyperliquidAttestationInfoReplay(capturedBody)) {
        storeInRequestsMap(matchRequestId, { isTarget: 2 });
        continue;
      }
    }

    const jsonPathArr = shouldValidateReplayOnly
      ? []
      : thisResponseObj.conditions.subconditions.map((i) => {
          if (isRequestBodyRangeSubcondition(i)) {
            return i;
          }
          const resolved = resolveJsonPathForValidation(i);
          if (resolved != null) {
            return resolved;
          }
          return isObject(i.field) && i.field?.field ? i.field.field : i.field;
        });

    if (htmlTemplateDebug) {
      logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:slot', {
        requestId: matchRequestId,
        templateRequestUrl,
        slotIndex: thisRequestUrlIdx,
        capturedUrl: requestsMap[matchRequestId]?.url,
        webRequestType: requestsMap[matchRequestId]?.type,
        shouldValidateReplayOnly,
        ignoreResponse: thisRequestObj?.ignoreResponse,
        validationExpressions: jsonPathArr,
      });
    }

    const baseRequestUrl = requestsMap[matchRequestId].url;
    const additionParamsObj = activeTemplate?.additionParamsObj || {};
    const needUpdateRequests = additionParamsObj.needUpdateRequests;
    const hasNeedUpdateRequests =
      Array.isArray(needUpdateRequests) && needUpdateRequests.length > 0;
    const updateParams = hasNeedUpdateRequests
      ? needUpdateRequests[thisRequestUrlIdx] ?? {}
      : {};
    const hasQueryParams =
      typeof updateParams.queryParams === 'object' &&
      updateParams.queryParams !== null &&
      !Array.isArray(updateParams.queryParams);
    const hasBodyParams =
      typeof updateParams.bodyParams === 'object' &&
      updateParams.bodyParams !== null &&
      !Array.isArray(updateParams.bodyParams);
    const mergedUrl =
      hasNeedUpdateRequests && hasQueryParams
        ? mergeQueryParamsIntoUrl(baseRequestUrl, updateParams.queryParams)
        : baseRequestUrl;
    const mergedBody =
      hasNeedUpdateRequests && hasBodyParams
        ? mergeBodyParams(
            requestsMap[matchRequestId].body,
            updateParams.bodyParams
          )
        : requestsMap[matchRequestId].body;

    let matchRequestUrlResult;
    let isTargetUrl = false;
    let negativeIndexCheckFailed = false;
    let fetchedContentType = '';
    let fetchedResponseUrl = '';

    const rejectNegativeIndexCondition = async () => {
      await handleAttestationError(
        {
          desc: 'Attestation condition not met.',
          code: '00104',
        },
        state.dataSourcePageTabId,
        {}
      );
    };

    let effectiveRequestUrl = mergedUrl;
    if (isReputationPhalaBinanceEarnBalanceTemplate(activeTemplate)) {
      const newRequestMap =
        updateRequestMapFnForReputationPhalaBinanceEarnBalance(
          {
            ...requestsMap[matchRequestId],
            url: mergedUrl,
            body: mergedBody,
          },
          additionParamsObj
        );
      effectiveRequestUrl = newRequestMap.url;
      storeInRequestsMap(matchRequestId, newRequestMap);
    }

    const urlForFetch =
      requestsMap[matchRequestId].type !== 'main_frame' &&
      (isLumaMonadTemplate(activeTemplate) ||
        isLumaPagedApprovedTemplate(activeTemplate))
        ? eventListUrlForMonad(mergedUrl)
        : effectiveRequestUrl;

    if (requestsMap[matchRequestId].type === 'main_frame') {
      let fetched = null;
      try {
        fetched = await fetchHtmlContent({
          ...requestsMap[matchRequestId],
          header: requestsMap[matchRequestId].headers,
          url: mergedUrl,
          body: mergedBody,
        });
      } catch (fetchErr) {
        if (htmlTemplateDebug) {
          logHtmlTemplateDebug(activeTemplate, 'main_frame:fetchFailed', {
            requestId: matchRequestId,
            mergedUrl,
            error: fetchErr?.message || String(fetchErr),
          });
        }
      }
      if (fetched) {
        matchRequestUrlResult = fetched.data;
        fetchedResponseUrl = fetched.finalUrl;
        if (htmlTemplateDebug) {
          logHtmlTemplateDebug(activeTemplate, 'main_frame:fetchOk', {
            requestId: matchRequestId,
            mergedUrl,
            fetchedResponseUrl,
            bodyLength:
              typeof matchRequestUrlResult === 'string'
                ? matchRequestUrlResult.length
                : 0,
            hasUserLoginMeta:
              typeof matchRequestUrlResult === 'string' &&
              matchRequestUrlResult.includes('name="user-login"'),
          });
        }
      } else if (htmlTemplateDebug) {
        logHtmlTemplateDebug(activeTemplate, 'main_frame:fetchEmpty', {
          requestId: matchRequestId,
          mergedUrl,
        });
      }
      if (
        !isFetchedResponseForRequest(mergedUrl, fetchedResponseUrl)
      ) {
        if (htmlTemplateDebug) {
          logHtmlTemplateDebug(activeTemplate, 'main_frame:urlMismatch', {
            requestId: matchRequestId,
            mergedUrl,
            fetchedResponseUrl,
          });
        }
        storeInRequestsMap(matchRequestId, { isTarget: 2 });
        continue;
      }
      if (shouldValidateReplayOnly) {
        if (fetched) {
          storeInRequestsMap(matchRequestId, {
            isTarget: 1,
            url: mergedUrl,
            body: mergedBody,
          });
          break;
        }
        storeInRequestsMap(matchRequestId, { isTarget: 2 });
        continue;
      }
      if (matchRequestUrlResult) {
        isTargetUrl = validateHtmlResponseCondition(
          jsonPathArr,
          matchRequestUrlResult
        );
        if (htmlTemplateDebug) {
          logHtmlTemplateDebug(activeTemplate, 'main_frame:xpathValidation', {
            requestId: matchRequestId,
            mergedUrl,
            fetchedResponseUrl,
            bodyLength: matchRequestUrlResult.length,
            isTargetUrl,
            xpathPreview: previewXPathValidationOnHtml(
              matchRequestUrlResult,
              jsonPathArr
            ),
          });
        }
        if (isTargetUrl) {
          storeInRequestsMap(matchRequestId, {
            isTarget: 1,
            url: mergedUrl,
            body: mergedBody,
          });
          break;
        }
      }
    } else {
      const fetchForValidation = isStreamRequest
        ? fetchRequestDataForStreamTemplateValidation
        : fetchRequestDataForTemplateValidation;
      const fetched = await fetchForValidation({
        ...requestsMap[matchRequestId],
        header: requestsMap[matchRequestId].headers,
        url: urlForFetch,
        body: mergedBody,
      });
      if (fetched) {
        matchRequestUrlResult = fetched.data;
        fetchedContentType = fetched.contentType;
        fetchedResponseUrl = fetched.finalUrl;
      }
    }

    if (requestsMap[matchRequestId].type !== 'main_frame') {
      if (
        !isFetchedResponseForRequest(urlForFetch, fetchedResponseUrl)
      ) {
        if (htmlTemplateDebug) {
          logHtmlTemplateDebug(activeTemplate, 'replay:urlMismatch', {
            requestId: matchRequestId,
            urlForFetch,
            fetchedResponseUrl,
            contentType: fetchedContentType,
          });
        }
        storeInRequestsMap(matchRequestId, { isTarget: 2 });
        continue;
      }
      if (shouldValidateReplayOnly) {
        if (fetchedResponseUrl) {
          storeInRequestsMap(matchRequestId, {
            isTarget: 1,
            url: effectiveRequestUrl,
            body: mergedBody,
          });
          break;
        }
        storeInRequestsMap(matchRequestId, { isTarget: 2 });
        continue;
      }

      const replayLooksLikeHtml = shouldTreatFetchedBodyAsHtmlForValidation(
        fetchedContentType,
        matchRequestUrlResult
      );

      if (
        replayLooksLikeHtml &&
        typeof matchRequestUrlResult === 'string' &&
        matchRequestUrlResult
      ) {
        isTargetUrl = validateHtmlResponseCondition(
          jsonPathArr,
          matchRequestUrlResult
        );
        if (htmlTemplateDebug) {
          logHtmlTemplateDebug(activeTemplate, 'replayHtml:xpathValidation', {
            requestId: matchRequestId,
            urlForFetch,
            effectiveRequestUrl,
            fetchedResponseUrl,
            contentType: fetchedContentType,
            bodyLength: matchRequestUrlResult.length,
            isTargetUrl,
            xpathPreview: previewXPathValidationOnHtml(
              matchRequestUrlResult,
              jsonPathArr
            ),
          });
        }
      } else if (isLumaMonadTemplate(activeTemplate) && matchRequestUrlResult) {
        const notMetHandler = async () => {
          await handleAttestationError(
            {
              desc: 'Monad event or profile check failed.',
              code: '00104',
            },
            state.dataSourcePageTabId,
            {}
          );
        };
        const requestMonadMeta = {
          ...requestsMap[matchRequestId],
          headers: requestsMap[matchRequestId].headers,
          url: requestsMap[matchRequestId].url,
        };
        isTargetUrl = await checkTargetRequestFnForMonad(
          urlForFetch,
          matchRequestUrlResult,
          requestMonadMeta,
          notMetHandler
        );
      } else if (
        isLumaPagedApprovedTemplate(activeTemplate) &&
        matchRequestUrlResult
      ) {
        const notMetHandler = async () => {
          await handleAttestationError(
            {
              desc: 'No approved Luma event entries.',
              code: '00104',
            },
            state.dataSourcePageTabId,
            {}
          );
        };
        const requestLumaPagedMeta = {
          ...requestsMap[matchRequestId],
          headers: requestsMap[matchRequestId].headers,
          url: requestsMap[matchRequestId].url,
        };
        isTargetUrl = await checkTargetRequestFnForLumaPagedApproved(
          urlForFetch,
          matchRequestUrlResult,
          requestLumaPagedMeta,
          notMetHandler
        );
      } else if (
        isReputationPhalaBinanceEarnBalanceTemplate(activeTemplate) &&
        matchRequestUrlResult
      ) {
        const notMetHandler = async () => {
          await handleAttestationError(
            {
              desc: 'Binance earn balance check failed.',
              code: '00104',
            },
            state.dataSourcePageTabId,
            {}
          );
        };
        isTargetUrl =
          await checkTargetRequestFnForReputationPhalaBinanceEarnBalance(
            matchRequestUrlResult,
            notMetHandler,
            additionParamsObj
          );
      } else if (
        isReputationPhalaCvmListTemplate(activeTemplate) &&
        matchRequestUrlResult &&
        effectiveRequestUrl.includes(PHALA_CVM_LIST_BATCH_STATUS_URL)
      ) {
        const notMetHandler = async () => {
          await handleAttestationError(
            {
              desc: 'Phala CVM list check failed.',
              code: '00104',
            },
            state.dataSourcePageTabId,
            {}
          );
        };
        isTargetUrl = await checkTargetRequestFnForReputationPhalaCvmList(
          matchRequestUrlResult,
          notMetHandler
        );
      } else if (
        isChannelSubscriptionTemplate(activeTemplate) &&
        matchRequestUrlResult
      ) {
        const formatRes = formatJsonArrFnForChannelSubscription(
          jsonPathArr,
          requestsMap[matchRequestId],
          thisRequestObj.matchReqBodyKey,
          matchRequestUrlResult
        );
        if (formatRes?.negativeIndexResolutionFailed) {
          negativeIndexCheckFailed = true;
          await rejectNegativeIndexCondition();
        } else {
          isTargetUrl = !!(formatRes && formatRes.checkRes);
        }
      } else {
        const needsResponse = conditionSetNeedsResponse(jsonPathArr);
        const needsBody = conditionSetNeedsRequestBody(jsonPathArr);
        const canValidate =
          jsonPathArr.length > 0 &&
          (!needsResponse || matchRequestUrlResult != null) &&
          (!needsBody || mergedBody != null);
        if (canValidate) {
          const checkResult = validateResponseCondition(
            jsonPathArr,
            matchRequestUrlResult,
            mergedBody,
            jsonPathEvaluationOptions
          );
          if (checkResult.negativeIndexResolutionFailed) {
            negativeIndexCheckFailed = true;
            await rejectNegativeIndexCondition();
          } else {
            isTargetUrl = checkResult.isMatch;
          }
          if (htmlTemplateDebug) {
            logHtmlTemplateDebug(activeTemplate, 'replayJson:validation', {
              requestId: matchRequestId,
              urlForFetch,
              fetchedResponseUrl,
              contentType: fetchedContentType,
              replayLooksLikeHtml,
              isTargetUrl,
              canValidate,
              negativeIndexResolutionFailed:
                checkResult?.negativeIndexResolutionFailed,
              responsePreview:
                typeof matchRequestUrlResult === 'string'
                  ? matchRequestUrlResult.slice(0, 200)
                  : matchRequestUrlResult != null
                    ? '[non-string body]'
                    : null,
            });
          }
        }
      }
      if (
        isTargetUrl &&
        !isLumaMonadTemplate(activeTemplate) &&
        !isLumaPagedApprovedTemplate(activeTemplate)
      ) {
        await tryApplyJumpConfigFromResponse({
          requestUrl: effectiveRequestUrl,
          responseData: matchRequestUrlResult,
          method: requestsMap[matchRequestId]?.method,
        });
      }
      if (negativeIndexCheckFailed) {
        break;
      }
      if (isTargetUrl) {
        const targetPayload = {
          isTarget: 1,
          url: effectiveRequestUrl,
          body: mergedBody,
        };
        if (
          matchRequestUrlResult &&
          typeof matchRequestUrlResult === 'object'
        ) {
          targetPayload.responseData = matchRequestUrlResult;
        }
        storeInRequestsMap(matchRequestId, targetPayload);
        break;
      }
    }
    if (!negativeIndexCheckFailed) {
      if (htmlTemplateDebug) {
        logHtmlTemplateDebug(activeTemplate, 'checkSDKTargetRequest:rejected', {
          requestId: matchRequestId,
          templateRequestUrl,
          slotIndex: thisRequestUrlIdx,
          isTargetUrl,
        });
      }
      storeInRequestsMap(matchRequestId, { isTarget: 2 });
    }
  }
}

/** Retry: content listener may register slightly after navigation. */
const WEB_REQUEST_READY_NOTIFY_ATTEMPTS = 8;
const WEB_REQUEST_READY_RETRY_DELAY_MS = 250;

const POLYMARKET_FORM_PROBE_NOTIFY_ATTEMPTS = 8;
const POLYMARKET_FORM_PROBE_NOTIFY_DELAY_MS = 250;

async function notifyPolymarketFormProbeStarted(state) {
  if (!matchesPolymarketPnlTemplate(state.activeTemplate)) return;
  const gate = state.polymarketProfileGate;
  if (gate?.formProbeStartedAt == null) return;
  const msg = buildPolymarketFormProbeStartedMessage(gate);
  for (let attempt = 0; attempt < POLYMARKET_FORM_PROBE_NOTIFY_ATTEMPTS; attempt++) {
    const sent = await sendMsgToDataSourcePage(msg);
    if (sent) {
      logPolymarketPnl('formProbeNotifyContent', { sent: true, attempt });
      return;
    }
    if (attempt < POLYMARKET_FORM_PROBE_NOTIFY_ATTEMPTS - 1) {
      await new Promise((r) =>
        setTimeout(r, POLYMARKET_FORM_PROBE_NOTIFY_DELAY_MS)
      );
    }
  }
  logPolymarketPnl('formProbeNotifyContent', { sent: false });
}

export async function notifyPolymarketGateUiSync(state) {
  if (!matchesPolymarketPnlTemplate(state.activeTemplate)) return;
  const msg = buildPolymarketGateUiSyncMessage(state);
  for (let attempt = 0; attempt < POLYMARKET_FORM_PROBE_NOTIFY_ATTEMPTS; attempt++) {
    const sent = await sendMsgToDataSourcePage(msg);
    if (sent) {
      logPolymarketPnl('gateUiNotifyContent', { sent: true, attempt, ...msg });
      return;
    }
    if (attempt < POLYMARKET_FORM_PROBE_NOTIFY_ATTEMPTS - 1) {
      await new Promise((r) =>
        setTimeout(r, POLYMARKET_FORM_PROBE_NOTIFY_DELAY_MS)
      );
    }
  }
  logPolymarketPnl('gateUiNotifyContent', { sent: false });
}

export async function finalizeWebRequestReady(state) {
  if (state.startHandled || state.phase === PAGE_DECODE_PHASES.ATTESTING) {
    return;
  }
  state.isReadyRequest = true;
  state.phase = PAGE_DECODE_PHASES.READY;
  if (!state.readyNotified) {
    const sent = await notifyDataSourcePageWebRequestReady();
    if (sent) {
      state.readyNotified = true;
    }
  }
  await notifyPageDecodeReadyUi(state);
  if (matchesGoogleEmailTemplate(state.activeTemplate)) {
    logGoogleEmail('finalizeWebRequestReady', {
      dataSourcePageTabId: state.dataSourcePageTabId,
      readyNotified: state.readyNotified,
      pageDecodeReadyUiNotified: state.pageDecodeReadyUiNotified,
    });
  }
  await beginPageDecodeAttestation(state);
}

async function notifyDataSourcePageWebRequestReady() {
  const msg = {
    type: 'pageDecode',
    name: 'webRequestIsReady',
    params: { isReady: true },
  };
  for (let attempt = 0; attempt < WEB_REQUEST_READY_NOTIFY_ATTEMPTS; attempt++) {
    const ok = await sendMsgToDataSourcePage(msg);
    if (ok) return true;
    if (attempt < WEB_REQUEST_READY_NOTIFY_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, WEB_REQUEST_READY_RETRY_DELAY_MS));
    }
  }
  console.warn('[pageDecode] webRequestIsReady notify failed');
  return false;
}

/**
 * Check if all required requests are captured and matched; if so, build algorithm params and notify.
 */
export async function checkWebRequestIsReady() {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  if (state.startHandled || state.phase === PAGE_DECODE_PHASES.ATTESTING) {
    return state.isReadyRequest;
  }
  if (state.isReadyRequest && state.phase === PAGE_DECODE_PHASES.READY) {
    return true;
  }
  const { requestsMap, formatAlgorithmParams } = state;
  const template = getActiveDatasourceTemplate(state, 'checkWebRequestIsReady');
  if (!template) return false;
  const { requests } = template;

  const interceptorRequests = requests.filter(
    (r) => r.needCapture !== false
  );
  const interceptorUrlArr = interceptorRequests.map((i) => i.url);
  const storageArr = Object.values(requestsMap);

  if (
    interceptorUrlArr.length === 0 ||
    storageArr.length < interceptorUrlArr.length
  ) {
    return false;
  }

  let captureNum = 0;
  interceptorRequests.forEach((r) => {
    const activeRequestInfo = Object.values(requestsMap).find((rInfo) =>
      checkIsRequiredUrl({
        requestUrl: rInfo.url,
        requiredUrl: r.url,
        urlType: r.urlType,
        queryParams: r.queryParams,
      })
    );
    if (activeRequestInfo) {
      const sRrequestObj = requestsMap[activeRequestInfo.requestId] || {};
      const headersFlag =
        !r.headers || (!!r.headers && !!sRrequestObj.headers);
      const bodyFlag = !r.body || (!!r.body && !!sRrequestObj.body);
      const cookieFlag =
        !r.cookies ||
        (!!r.cookies &&
          !!sRrequestObj.headers?.Cookie);
      if (headersFlag && bodyFlag && cookieFlag) captureNum += 1;
    }
  });

  const f = captureNum === interceptorRequests.length;
  const allRequestUrlFoundFlag = interceptorUrlArr.every((url) =>
    Object.values(requestsMap).some(
      (sInfo) => sInfo.templateRequestUrl === url && sInfo.isTarget === 1
    )
  );
  const fl = f && allRequestUrlFoundFlag;

  if (matchesHtmlTemplateDebug(state.activeTemplate)) {
    logHtmlTemplateDebug(state.activeTemplate, 'checkWebRequestIsReady', {
      captureNum,
      requiredCaptureSlots: interceptorRequests.length,
      headersAndBodyComplete: f,
      allRequestUrlFoundFlag,
      ready: fl,
      phase: state.phase,
      summary: summarizeHtmlTemplateCapture(
        state.activeTemplate,
        interceptorRequests,
        requestsMap
      ),
    });
  }

  if (fl && !formatAlgorithmParams) {
    await formatAlgorithmParamsFn();
  }

  if (fl && !canFinalizePageDecodeReady(state)) {
    return fl;
  }

  if (fl) {
    if (state.startHandled || state.phase === PAGE_DECODE_PHASES.ATTESTING) {
      return fl;
    }
    if (state.isReadyRequest) {
      if (!state.pageDecodeReadyUiNotified) {
        await notifyPageDecodeReadyUi(state);
      }
      return fl;
    }
    const firstCaptureComplete = !state.isReadyRequest;
    if (firstCaptureComplete) {
      console.log('all web requests are captured', requestsMap);
    }
    await onPolymarketWebRequestCaptureComplete(state, finalizeWebRequestReady, {
      notifyGateUiSync: () => notifyPolymarketGateUiSync(state),
    });
    if (state.isReadyRequest && !state.pageDecodeReadyUiNotified) {
      await notifyPageDecodeReadyUi(state);
    }
    await notifyPolymarketFormProbeStarted(state);
    await notifyPolymarketGateUiSync(state);
  }
  return fl;
}

let checkReadyDebounceTimer = null;

function debouncedCheckWebRequestIsReady() {
  clearTimeout(checkReadyDebounceTimer);
  checkReadyDebounceTimer = setTimeout(() => {
    checkWebRequestIsReady();
  }, 200);
}

/**
 * Attach webRequest listeners for the data source tab. Mutates state with listener refs for removal.
 */
export function setupWebRequestListener() {
  const pageDecodeState = getPageDecodeState();
  const { state, storeInRequestsMap, removeFromRequestsMap } = pageDecodeState;

  const onBeforeSendHeadersFn = async (details) => {
    if (shouldIgnorePageDecodeWebRequest(details, state, chrome.runtime.id)) {
      return;
    }
    if (details.method === 'OPTIONS') return;

    await onPolymarketUsersMePutObserved(
      state,
      details.method,
      details.url,
      finalizeWebRequestReady
    );
    await notifyPolymarketGateUiSync(state);

    const { url: currRequestUrl, requestHeaders, method, requestId } = details;

    let addQueryStr = '';
    const formatHeader = sanitizeRequestHeaders(
      requestHeaders.reduce((prev, curr) => {
        prev[curr.name] = curr.value;
        return prev;
      }, {})
    );

    if (
      matchesHyperliquidPnlTemplate(state.activeTemplate) &&
      isHyperliquidInfoPost(method, currRequestUrl)
    ) {
      storeInRequestsMap(requestId, {
        headers: formatHeader,
        method,
        url: currRequestUrl,
        requestId,
      });
      const mergedCapture = state.requestsMap[requestId];
      const navigateToPortfolio = () =>
        navigateDataSourceTabToPortfolio(state.dataSourcePageTabId);
      await onHyperliquidInfoRequestObserved(
        state,
        {
          url: currRequestUrl,
          method,
          requestId,
          captured: mergedCapture,
          body: mergedCapture?.body,
        },
        navigateToPortfolio,
        { fetchRequestData: fetchRequestDataForTemplateValidation }
      );
      await ensureHyperliquidJoinLegalCheck(
        state,
        {
          url: currRequestUrl,
          method,
          requestId,
          captured: mergedCapture,
        },
        navigateToPortfolio,
        { fetchRequestData: fetchRequestDataForTemplateValidation }
      );
    }

    const template = getActiveDatasourceTemplate(state, 'onBeforeSendHeadersFn');
    if (!template) return;
    const { requests } = template;

    let templateRequestUrl = '';
    const isTarget = requests.some((r) => {
      if (r.needCapture === false) return false;
      if (r.queryParams?.[0]) {
        const urlStrArr = currRequestUrl.split('?');
        const hostUrl = urlStrArr[0];
        if (r.url === hostUrl) {
          const curUrlWithQuery = isUrlWithQueryFn(currRequestUrl, r.queryParams);
          if (curUrlWithQuery) addQueryStr = curUrlWithQuery;
        }
      }
      const checkRes = checkIsRequiredUrl({
        requestUrl: currRequestUrl,
        requiredUrl: r.url,
        urlType: r.urlType,
        queryParams: r.queryParams,
      });
      if (checkRes) templateRequestUrl = r.url;
      return checkRes;
    });

    await tryJumpConfigPresenceStep({ currRequestUrl, method });

    if (isTarget) {
      console.log('captured request', currRequestUrl,JSON.stringify(details));
      if (matchesGithubHomeTemplate(state.activeTemplate)) {
        logGitHubHome('capture:matched', {
          currRequestUrl,
          method,
          templateRequestUrl,
          requestId,
          type: details.type,
          tabId: details.tabId,
        });
      }
      if (matchesGoogleEmailTemplate(state.activeTemplate)) {
        logGoogleEmail('capture:matched', {
          currRequestUrl,
          method,
          templateRequestUrl,
          requestId,
          type: details.type,
          tabId: details.tabId,
          dataSourcePageTabId: state.dataSourcePageTabId,
          slots: describeUrlMatchForRequests(
            state.activeTemplate,
            currRequestUrl,
            requests
          ),
        });
      }
      if (matchesPolymarketPnlTemplate(state.activeTemplate)) {
        logPolymarketPnl('templateTargetRequestCaptured', {
          url: currRequestUrl,
          method,
          templateRequestUrl,
          requestId,
        });
      }
      const newCapturedInfo = {
        headers: formatHeader,
        method,
        url: currRequestUrl,
        requestId,
        templateRequestUrl,
        type: details.type,
      };
      if (addQueryStr) newCapturedInfo.queryString = addQueryStr;
      storeInRequestsMap(requestId, newCapturedInfo);
      await markFirstConfiguredRequestCapturedIfNeeded();
      await trySendSecondRequestWithFirstHeaders();
      if (!shouldDeferHyperliquidPortfolioValidation(state)) {
        await checkSDKTargetRequest(requestId, templateRequestUrl);
      }
      debouncedCheckWebRequestIsReady();
    } else {
      if (matchesGithubHomeTemplate(state.activeTemplate)) {
        logGitHubHome('capture:urlNotMatched', {
          currRequestUrl,
          method,
          type: details.type,
          requestId,
          tabId: details.tabId,
          slots: describeUrlMatchForRequests(
            state.activeTemplate,
            currRequestUrl,
            requests
          ),
        });
      }
      if (
        matchesGoogleEmailTemplate(state.activeTemplate) &&
        shouldLogUrlProbeForRequest(currRequestUrl)
      ) {
        logGoogleEmail('capture:urlProbe', {
          currRequestUrl,
          method,
          type: details.type,
          requestId,
          tabId: details.tabId,
          dataSourcePageTabId: state.dataSourcePageTabId,
          tabIdMatchesDataSource: details.tabId === state.dataSourcePageTabId,
          slots: describeUrlMatchForRequests(
            state.activeTemplate,
            currRequestUrl,
            requests
          ),
        });
      }
      await tryJumpConfigStandaloneIntercept({
        currRequestUrl,
        method,
        formatHeader,
        requestId,
        type: details.type,
        storeInRequestsMap,
      });
      debouncedCheckWebRequestIsReady();
    }
  };

  const onBeforeRequestFn = async (subDetails) => {
    if (
      shouldIgnorePageDecodeWebRequest(
        subDetails,
        state,
        chrome.runtime.id
      )
    ) {
      return;
    }
    if (subDetails.method === 'OPTIONS') return;

    const { url: currRequestUrl, requestBody, requestId, method } = subDetails;

    removeFromRequestsMap(requestId);

    const jumpBodyCapture = shouldStoreBodyForJumpConfig(
      state,
      currRequestUrl,
      subDetails.method
    );

    let parsedBody = null;
    if (requestBody?.raw?.[0]?.bytes) {
      try {
        const byteArray = new Uint8Array(requestBody.raw[0].bytes);
        parsedBody = JSON.parse(new TextDecoder().decode(byteArray));
      } catch (_error) {
        parsedBody = null;
      }
    }

    if (
      matchesHyperliquidPnlTemplate(state.activeTemplate) &&
      isHyperliquidInfoPost(method || 'POST', currRequestUrl)
    ) {
      if (parsedBody != null) {
        rememberHyperliquidInfoUser(state, parsedBody);
        storeInRequestsMap(requestId, {
          url: currRequestUrl,
          requestId,
          method: method || 'POST',
          body: parsedBody,
        });
      }
    }

    const template = getActiveDatasourceTemplate(state, 'onBeforeRequestFn');
    if (!template) return;
    const { requests } = template;

    const isTarget = requests.some((r) => {
      if (r.needCapture === false) return false;
      return checkIsRequiredUrl({
        requestUrl: currRequestUrl,
        requiredUrl: r.url,
        urlType: r.urlType,
        queryParams: r.queryParams,
      });
    });

    if (isTarget || jumpBodyCapture) {
      const baseCapture = {
        url: currRequestUrl,
        requestId,
        method: method || 'GET',
      };
      if (parsedBody != null) {
        storeInRequestsMap(requestId, {
          ...baseCapture,
          body: parsedBody,
        });
      }
      if (requestBody?.formData) {
        storeInRequestsMap(requestId, {
          ...baseCapture,
          body: requestBody.formData,
          isFormData: true,
        });
      }
    }

  };

  state.onBeforeSendHeadersFn = onBeforeSendHeadersFn;
  state.onBeforeRequestFn = onBeforeRequestFn;

  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeadersFn,
    { urls: ['<all_urls>'], types: ['xmlhttprequest', 'main_frame'] },
    ['requestHeaders', 'extraHeaders']
  );
  chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestFn,
    { urls: ['<all_urls>'], types: ['xmlhttprequest', 'main_frame'] },
    ['requestBody']
  );
}

/** Remove webRequest listeners. Call after close/end/tab removed. */
export function removeWebRequestListener() {
  const { state } = getPageDecodeState();
  if (state.onBeforeSendHeadersFn) {
    chrome.webRequest.onBeforeSendHeaders.removeListener(
      state.onBeforeSendHeadersFn
    );
    state.onBeforeSendHeadersFn = () => {};
  }
  if (state.onBeforeRequestFn) {
    chrome.webRequest.onBeforeRequest.removeListener(state.onBeforeRequestFn);
    state.onBeforeRequestFn = () => {};
  }
}

/**
 * Start attestation after capture ready (primary path; content `start` is fallback).
 * @param {import('./state.js').PageDecodeState['state']} state
 * @returns {Promise<boolean>}
 */
export async function beginPageDecodeAttestation(state) {
  if (!state || state.startHandled) {
    return false;
  }
  if (!state.formatAlgorithmParams) {
    console.warn('[pageDecode] beginPageDecodeAttestation: missing formatAlgorithmParams');
    return false;
  }

  state.startHandled = true;
  state.isReadyRequest = true;
  state.phase = PAGE_DECODE_PHASES.ATTESTING;

  removeWebRequestListener();
  startKeepAlive();

  const { userInfo } = await safeStorageGet(['userInfo']);
  if (!userInfo) {
    ensureExtensionUserIdentity().catch((err) => {
      console.log('ensureExtensionUserIdentity non-blocking error', err);
    });
  }

  const aligorithmParams = Object.assign(
    { isUserClick: 'true' },
    state.formatAlgorithmParams
  );
  const session = await getSdkAttestationSession();
  const getAttestationParams = {
    ...aligorithmParams,
    clientType: session?.clientType || '',
  };
  await safeStorageSet({
    activeRequestAttestation: JSON.stringify(aligorithmParams),
  });
  console.log('pageDecode-algorithmParams', aligorithmParams);
  chrome.runtime.sendMessage({
    type: 'algorithm',
    method: 'getAttestation',
    params: getAttestationParams,
  });

  await notifyPageDecodeReadyUi(state, { force: true });
  return true;
}
