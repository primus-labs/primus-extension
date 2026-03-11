/**
 * Web request interception for page decode: capture requests, match templates, signal when ready.
 */
import { isObject } from '../utils/utils';
import { checkIsRequiredUrl, isUrlWithQueryFn } from '../utils/utils';
import {
  fetchRequestData,
  fetchHtmlContent,
  validateResponseCondition,
  validateHtmlResponseCondition,
} from './utils';
import { getPageDecodeState } from './state';
import { formatAlgorithmParamsFn } from './templateMatcher';
import { sendMsgToDataSourcePage } from './sdkBridge';

/**
 * Check if a captured request matches the template response conditions; mark as target if so.
 */
export async function checkSDKTargetRequest(requestId, templateRequestUrl) {
  const pageDecodeState = getPageDecodeState();
  const { state, storeInRequestsMap } = pageDecodeState;
  const { requestsMap } = state;
  const activeTemplate = state.activeTemplate;
  const {
    datasourceTemplate: { requests, responses },
  } = activeTemplate;

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

    const targetRequestUrl = requestsMap[matchRequestId].url;
    let matchRequestUrlResult;
    let isTargetUrl = false;

    if (requestsMap[matchRequestId].type === 'main_frame') {
      matchRequestUrlResult = await fetchHtmlContent({
        ...requestsMap[matchRequestId],
        header: requestsMap[matchRequestId].headers,
        url: targetRequestUrl,
      });
      if (matchRequestUrlResult) {
        isTargetUrl = validateHtmlResponseCondition(
          jsonPathArr,
          matchRequestUrlResult
        );
        if (isTargetUrl) {
          storeInRequestsMap(matchRequestId, { isTarget: 1 });
          break;
        }
      }
    } else {
      matchRequestUrlResult = await fetchRequestData({
        ...requestsMap[matchRequestId],
        header: requestsMap[matchRequestId].headers,
        url: targetRequestUrl,
      });
    }

    isTargetUrl = validateResponseCondition(jsonPathArr, matchRequestUrlResult);
    if (isTargetUrl) {
      storeInRequestsMap(matchRequestId, { isTarget: 1 });
      break;
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
  const { requestsMap, activeTemplate, formatAlgorithmParams } = state;
  const {
    datasourceTemplate: { requests },
  } = activeTemplate;

  const interceptorRequests = requests.filter((r) => r.name !== 'first');
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
    console.log('all web requests are captured', requestsMap);
    await sendMsgToDataSourcePage({
      type: 'pageDecode',
      name: 'webRequestIsReady',
      params: { isReady: true },
    });
  }
  return fl;
}

/**
 * Attach webRequest listeners for the data source tab. Mutates state with listener refs for removal.
 */
export function setupWebRequestListener() {
  const pageDecodeState = getPageDecodeState();
  const { state, storeInRequestsMap, removeFromRequestsMap } = pageDecodeState;
  const dataSourcePageTabId = state.dataSourcePageTabId;

  const onBeforeSendHeadersFn = async (details) => {
    if (
      details?.initiator?.startsWith(`chrome-extension://${chrome.runtime.id}`)
    ) {
      return;
    }
    if (![-1, dataSourcePageTabId].includes(details.tabId)) return;
    if (details.method === 'OPTIONS') return;

    const {
      datasourceTemplate: { requests },
    } = state.activeTemplate;
    const { url: currRequestUrl, requestHeaders, method, requestId } = details;

    let addQueryStr = '';
    const formatHeader = requestHeaders.reduce((prev, curr) => {
      prev[curr.name] = curr.value;
      return prev;
    }, {});

    let templateRequestUrl = '';
    const isTarget = requests.some((r) => {
      if (r.name === 'first') return false;
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
      await checkSDKTargetRequest(requestId, templateRequestUrl);
      await checkWebRequestIsReady();
    }
  };

  const onBeforeRequestFn = async (subDetails) => {
    if (
      subDetails?.initiator?.startsWith(`chrome-extension://${chrome.runtime.id}`)
    ) {
      return;
    }
    if (![-1, dataSourcePageTabId].includes(subDetails.tabId)) return;
    if (subDetails.method === 'OPTIONS') return;

    const {
      datasourceTemplate: { requests },
    } = state.activeTemplate;
    const { url: currRequestUrl, requestBody, requestId } = subDetails;

    removeFromRequestsMap(requestId);
    const isTarget = requests.some((r) => {
      if (r.name === 'first') return false;
      return checkIsRequiredUrl({
        requestUrl: currRequestUrl,
        requiredUrl: r.url,
        urlType: r.urlType,
        queryParams: r.queryParams,
      });
    });

    if (isTarget) {
      if (requestBody?.raw?.[0]?.bytes) {
        const byteArray = new Uint8Array(requestBody.raw[0].bytes);
        const bodyText = new TextDecoder().decode(byteArray);
        storeInRequestsMap(requestId, { body: JSON.parse(bodyText) });
      }
      if (requestBody?.formData) {
        storeInRequestsMap(requestId, {
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
