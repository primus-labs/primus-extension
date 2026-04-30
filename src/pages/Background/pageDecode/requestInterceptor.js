/* global chrome, console, clearTimeout, setTimeout, Uint8Array, TextDecoder, URL */
/**
 * Web request interception for page decode: capture requests, match templates, signal when ready.
 */
import { isObject } from '../utils/utils';
import {
  checkIsRequiredUrl,
  isUrlWithQueryFn,
  mergeQueryParamsIntoUrl,
  mergeBodyParams,
} from '../utils/utils';
import {
  fetchRequestDataForTemplateValidation,
  fetchHtmlContent,
  validateResponseCondition,
  validateHtmlResponseCondition,
  handleAttestationError,
  shouldTreatFetchedBodyAsHtmlForValidation,
} from './utils';
import {
  eventListUrlForMonad,
  checkTargetRequestFnForMonad,
  isLumaMonadTemplate,
} from './specialTemplates/lumaMonad';
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
import { formatAlgorithmParamsFn } from './templateMatcher';
import { sendMsgToDataSourcePage } from './sdkBridge';
import { trySendSecondRequestWithFirstHeaders } from './specialTemplates/specialTemplateSendSecondRequest';
import {
  tryApplyJumpConfigFromResponse,
  tryJumpConfigStandaloneIntercept,
  shouldStoreBodyForJumpConfig,
} from './jumpConfigRedirect';

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
  const { requestsMap } = state;
  const activeTemplate = state.activeTemplate;
  const template = getActiveDatasourceTemplate(state, 'checkSDKTargetRequest');
  if (!template) return;
  const { requests, responses } = template;

  const thisRequestUrlIdx = requests.findIndex((r) => r.url === templateRequestUrl);
  const thisRequestObj = requests[thisRequestUrlIdx];
  const thisResponseObj = responses[thisRequestUrlIdx];
  const { url, urlType, queryParams, ignoreResponse } = thisRequestObj;

  const thisRequestUrlFoundFlag = Object.values(requestsMap).find(
    (v) => v.templateRequestUrl === url && v.isTarget === 1
  );

  if (thisRequestUrlFoundFlag) return;

  if (ignoreResponse) {
    const done = Object.entries(requestsMap).some(([rid, sInfo]) => {
      if (sInfo.templateRequestUrl === url && sInfo.headers) {
        storeInRequestsMap(rid, { isTarget: 1 });
        return true;
      }
      return false;
    });
    if (done) return;
  }

  const matchRequestIdArr = Object.keys(requestsMap).filter((key) =>
    checkIsRequiredUrl({
      requestUrl: requestsMap[key].url,
      requiredUrl: url,
      urlType: urlType || 'REGX',
      queryParams,
    })
  );

  for (const matchRequestId of matchRequestIdArr) {
    if (requestsMap[matchRequestId]?.isTarget === 1) break;
    if (requestsMap[matchRequestId]?.isTarget === 2) continue;

    const jsonPathArr = thisResponseObj.conditions.subconditions.map((i) => {
      if (i?.op === 'MATCH_ONE') return i;
      return isObject(i.field) && i.field?.field ? i.field.field : i.field;
    });

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
    let fetchedContentType = '';
    let fetchedResponseUrl = '';

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
      isLumaMonadTemplate(activeTemplate)
        ? eventListUrlForMonad(mergedUrl)
        : effectiveRequestUrl;

    if (requestsMap[matchRequestId].type === 'main_frame') {
      const fetched = await fetchHtmlContent({
        ...requestsMap[matchRequestId],
        header: requestsMap[matchRequestId].headers,
        url: mergedUrl,
        body: mergedBody,
      });
      if (fetched) {
        matchRequestUrlResult = fetched.data;
        fetchedResponseUrl = fetched.finalUrl;
      }
      if (
        !isFetchedResponseForRequest(mergedUrl, fetchedResponseUrl)
      ) {
        storeInRequestsMap(matchRequestId, { isTarget: 2 });
        continue;
      }
      if (matchRequestUrlResult) {
        isTargetUrl = validateHtmlResponseCondition(
          jsonPathArr,
          matchRequestUrlResult
        );
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
      const fetched = await fetchRequestDataForTemplateValidation({
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
        isTargetUrl = !!(formatRes && formatRes.checkRes);
      } else {
        isTargetUrl = validateResponseCondition(
          jsonPathArr,
          matchRequestUrlResult
        );
      }
      if (isTargetUrl && !isLumaMonadTemplate(activeTemplate)) {
        await tryApplyJumpConfigFromResponse({
          requestUrl: effectiveRequestUrl,
          responseData: matchRequestUrlResult,
          method: requestsMap[matchRequestId]?.method,
        });
      }
      if (isTargetUrl) {
        storeInRequestsMap(matchRequestId, {
          isTarget: 1,
          url: effectiveRequestUrl,
          body: mergedBody,
        });
        break;
      }
    }
    storeInRequestsMap(matchRequestId, { isTarget: 2 });
  }
}

/**
 * Check if all required requests are captured and matched; if so, build algorithm params and notify.
 */
export async function checkWebRequestIsReady() {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  if (state.phase === PAGE_DECODE_PHASES.ATTESTING) {
    return state.isReadyRequest;
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

  if (fl && !formatAlgorithmParams) {
    await formatAlgorithmParamsFn();
  }

  if (fl) {
    state.isReadyRequest = true;
    state.phase = PAGE_DECODE_PHASES.READY;
    console.log('all web requests are captured', requestsMap);
    if (!state.readyNotified) {
      state.readyNotified = true;
      await sendMsgToDataSourcePage({
        type: 'pageDecode',
        name: 'webRequestIsReady',
        params: { isReady: true },
      });
    }
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
    if (
      details?.initiator?.startsWith(`chrome-extension://${chrome.runtime.id}`)
    ) {
      return;
    }
    const dataSourcePageTabId = state.dataSourcePageTabId;
    if (![-1, dataSourcePageTabId].includes(details.tabId)) return;
    if (details.method === 'OPTIONS') return;
    
    const template = getActiveDatasourceTemplate(state, 'onBeforeSendHeadersFn');
    if (!template) return;
    const { requests } = template;
    const { url: currRequestUrl, requestHeaders, method, requestId } = details;

    let addQueryStr = '';
    const formatHeader = requestHeaders.reduce((prev, curr) => {
      prev[curr.name] = curr.value;
      return prev;
    }, {});

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

    if (isTarget) {
      console.log('captured request', currRequestUrl,details.type);
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
      await trySendSecondRequestWithFirstHeaders();
      await checkSDKTargetRequest(requestId, templateRequestUrl);
      debouncedCheckWebRequestIsReady();
    } else {
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
      subDetails?.initiator?.startsWith(`chrome-extension://${chrome.runtime.id}`)
    ) {
      return;
    }
    const dataSourcePageTabId = state.dataSourcePageTabId;
    if (![-1, dataSourcePageTabId].includes(subDetails.tabId)) return;
    if (subDetails.method === 'OPTIONS') return;

    const template = getActiveDatasourceTemplate(state, 'onBeforeRequestFn');
    if (!template) return;
    const { requests } = template;
    const { url: currRequestUrl, requestBody, requestId, method } = subDetails;

    removeFromRequestsMap(requestId);
    const isTarget = requests.some((r) => {
      if (r.needCapture === false) return false;
      return checkIsRequiredUrl({
        requestUrl: currRequestUrl,
        requiredUrl: r.url,
        urlType: r.urlType,
        queryParams: r.queryParams,
      });
    });

    const jumpBodyCapture = shouldStoreBodyForJumpConfig(
      state,
      currRequestUrl,
      subDetails.method
    );

    if (isTarget || jumpBodyCapture) {
      const baseCapture = {
        url: currRequestUrl,
        requestId,
        method: method || 'GET',
      };
      if (requestBody?.raw?.[0]?.bytes) {
        const byteArray = new Uint8Array(requestBody.raw[0].bytes);
        const bodyText = new TextDecoder().decode(byteArray);
        storeInRequestsMap(requestId, {
          ...baseCapture,
          body: JSON.parse(bodyText),
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
