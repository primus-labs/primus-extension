import {
  assembleAlgorithmParams,
  assembleAlgorithmParamsForSDK,
} from '../exData';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { eventReport } from '@/services/api/usertracker';
import customFetch from '../utils/request';
import {
  templateIdForMonad,
  eventListUrlForMonad,
  checkTargetRequestFnForMonad,
  formatRequestResponseFnForMonad,
} from '../lumaMonadEvent/index.js';
import {
  templateIdForNilion7Days,
  templateIdForNilion1Month,
  startTimeDistanceForNilion,
  rowForNilion,
} from '../nilionEvent/index.js';
import {
  templateIdForBinanceEarnHistory,
  formatRequestResponseFnForBinanceEarnHistory,
  updateRequestMapFnForbBinanceEarnHistory,
  templateIdForBinanceEarnHistoryABalance,
  formatRequestResponseFnForBinanceEarnHistoryABalance,
  templateIdForReputationPhalaBinanceEarnBalance,
  updateRequestMapFnForReputationPhalaBinanceEarnBalance,
  checkTargetRequestFnForReputationPhalaBinanceEarnBalance,
  formatRequestResponseFnForReputationPhalaBinanceEarnBalance,
  templateIdForBinanceSomeTokenBalance,
  templateIdForBinanceSomeTokenBalanceRequestUrl,
  checkTargetRequestFnForBinanceSomeTokenBalance,
  formatRequestResponseFnForBinanceSomeTokenBalance,
} from '../binanceEarnHistoryEvent/index.js';
import {
  templateIdForTwitch,
  formatJsonArrFnForTwitch,
  formatRequestResponseFnForTwitch,
} from '../twitchEvent/index.js';
import {
  lumaAccountTemplateId,
  lumaAccountTemplateReg,
  getLumaAccountTargetJumpUrl,
  getUserIdFromCookie,
} from '../scoreEvent/index.js';
import {
  templateIdForPhalaAccount,
  formatRequestResponseFnForPhalaAccount,
  formatRequestResponseFnForReputationPhalaCvmList,
  templateIdForReputaionPhalaCvmList,
  phalaCvmListRequestUrl,
  checkTargetRequestFnForReputationPhalaCvmList,
  templateIdForPhalaCvmList,
  formatRequestResponseFnForPhalaCvmList,
} from '../phala/index.js';
import {
  templateIdForOkxSomeTokenBalance,
  templateIdForOkxSomeTokenBalanceRequestUrl,
  checkTargetRequestFnForOkxSomeTokenBalance,
  formatRequestResponseFnForOkxSomeTokenBalance,
} from '../okx/index.js';
import {
  templateIdForCoinstatsSomeTokenBalance,
  checkTargetRequestFnForCoinstatsSomeTokenBalance,
  formatRequestResponseFnForCoinstatsSpotSomeTokenBalance,
} from '../coinstats/index.js';
import {
  isObject,
  parseCookie,
  isUrlWithQueryFn,
  checkIsRequiredUrl,
  getErrorMsgFn,
  sendMsgToTab,
} from '../utils/utils';
import { addSDKParamsToReportParamsFn } from '../utils/reportEvent.js';
import {
  extraRequestFn2,
  extraRequestHtmlFn,
  errorFn,
  checkResIsMatchConditionFn,
  checkResHtmlIsMatchConditionFn,
  getNMonthsBeforeTime,
} from './utils';

let PRE_ATTEST_PROMOT_V2 = [
  {
    text: ['Processing data'],
    showTime: 5000,
  },
  {
    text: ['Checking data', 'Ensure login and on target page.'],
    showTime: 30000,
  },
];
let dataSourcePageTabId;
let activeTemplate = {};
let currExtentionId;

let isReadyRequest = false;
let operationType = null;
let RequestsHasCompleted = false;
let formatAlgorithmParams = null;
let preAlgorithmStatus = '';
let preAlgorithmTimer = null;
let preAlgorithmFlag = false;
let chatgptHasLogin = false;
let listenerFn = () => {};
let onBeforeSendHeadersFn = () => {};
let onBeforeRequestFn = () => {};
let onCompletedFn = () => {};
let requestsMap = {};
let reportRequestIds = [];
let hasStartedPageDecodeAttestation = false;
let chatgptAuthorizationHeader = '';
let chatgptReadyPollTimer = null;
const CHATGPT_AUTH_HEADER_SESSION_KEY = 'kaitoChatGptAuthorizationHeader';
const isChatGptTemplateTargetUrl = (url) => {
  if (getActiveTemplateDataSource() !== 'chatgpt' || !url) {
    return false;
  }
  const templateRequests =
    activeTemplate?.datasourceTemplate?.requests ||
    activeTemplate?.dataSourceTemplate?.requests ||
    [];
  return templateRequests.some((request) => {
    if (!request?.url || request.name === 'first') {
      return false;
    }
    return (
      checkIsRequiredUrl({
        requestUrl: url,
        requiredUrl: request.url,
        urlType: request.urlType,
        queryParams: request.queryParams,
      }) ||
      (url.includes('/backend-api/subscriptions?') &&
        request.url.includes('/backend-api/subscriptions')) ||
      (url.includes('/backend-api/wham/usage') &&
        request.url.includes('/backend-api/wham/usage'))
    );
  });
};

const sendMsgToSdk = async (msg) => {
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
  if (dappTabId) {
    sendMsgToTab(dappTabId, msg);
  }
};
const sendMsgToDataSourcePage = async (msg) => {
  if (dataSourcePageTabId) {
    sendMsgToTab(dataSourcePageTabId, msg);
  }
};

const removeRequestsMap = async (url) => {
  // console.log('requestsMap-remove', url);
  // await chrome.storage.local.remove([
  //   'https://www.tiktok.com/passport/web/account/info/',
  //   'https://api.x.com/1.1/account/settings.json',
  // ]);
  delete requestsMap[url];
};
const storeRequestsMap = (url, urlInfo) => {
  const lastStoreRequestObj = requestsMap[url] || {};
  console.log('requestsMap-store', url, lastStoreRequestObj, urlInfo);
  const urlInfoHeaders = urlInfo?.headers;
  if (
    urlInfoHeaders &&
    (urlInfoHeaders?.['Content-Type']?.includes('text/plain') ||
      urlInfoHeaders?.['content-type']?.includes('text/plain')) &&
    lastStoreRequestObj.body
  ) {
    urlInfo.body = JSON.stringify(lastStoreRequestObj.body);
  }
  Object.assign(requestsMap, {
    [url]: { ...lastStoreRequestObj, ...urlInfo },
  });

  return requestsMap[url];
};
const redactRequestsMapForKaitoDebug = () =>
  Object.fromEntries(
    Object.entries(requestsMap).map(([key, value]) => {
      const headers = value?.headers || {};
      return [
        key,
        {
          url: value?.url,
          templateRequestUrl: value?.templateRequestUrl,
          method: value?.method,
          type: value?.type,
          isTarget: value?.isTarget,
          hasHeaders: Object.keys(headers).length > 0,
          headerKeys: Object.keys(headers),
          hasCookie: !!headers.Cookie || !!headers.cookie,
          hasAuthorization: !!headers.Authorization || !!headers.authorization,
          statusCode: value?.statusCode,
        },
      ];
    })
  );
const redactAlgorithmParamsForKaitoDebug = (params = {}) => ({
  source: params.source,
  schemaType: params.schemaType,
  templateId: params.templateId,
  requestCount: params.requests?.length,
  requests: params.requests?.map((request) => ({
    name: request.name,
    url: request.url,
    method: request.method,
    hasHeaders: !!request.headers,
    headerKeys: Object.keys(request.headers || {}),
    hasBody: request.body != null,
    targetRequestId: request.targetRequestId,
  })),
});
const getHeaderValue = (headers = {}, headerName = '') => {
  const key = Object.keys(headers || {}).find(
    (h) => h.toLowerCase() === headerName.toLowerCase()
  );
  return key ? headers[key] : undefined;
};

const hasAuthorizationHeader = (headers = {}) => {
  return !!getHeaderValue(headers, 'authorization');
};

const resetVarsFn = () => {
  isReadyRequest = false;
  operationType = null;
  RequestsHasCompleted = false;
  formatAlgorithmParams = null;
  preAlgorithmStatus = '';
  preAlgorithmTimer = null;
  preAlgorithmFlag = false;
  chatgptHasLogin = false;
  requestsMap = {};
  reportRequestIds = [];
  hasStartedPageDecodeAttestation = false;
  chatgptAuthorizationHeader = '';
  if (chatgptReadyPollTimer) {
    clearInterval(chatgptReadyPollTimer);
    chatgptReadyPollTimer = null;
  }
  chrome.runtime.onMessage.removeListener(listenerFn);
};
const getChatGptAuthorizationHeader = () => {
  if (chatgptAuthorizationHeader) {
    return chatgptAuthorizationHeader;
  }
  const authedRequest = Object.values(requestsMap).find((requestInfo) => {
    const headers = requestInfo?.headers || {};
    return !!headers.Authorization || !!headers.authorization;
  });
  const headers = authedRequest?.headers || {};
  return headers.Authorization || headers.authorization || '';
};
	const getChatGptHeaderFallback = () => {
		if (getActiveTemplateDataSource() !== 'chatgpt') {
			return {};
		}
  const authedRequests = Object.values(requestsMap).filter((requestInfo) => {
    const headers = requestInfo?.headers || {};
    return !!headers.Authorization || !!headers.authorization;
  });
  const requestWithMostHeaders = authedRequests.sort((left, right) => {
    return Object.keys(right?.headers || {}).length - Object.keys(left?.headers || {}).length;
		})[0];
		return { ...(requestWithMostHeaders?.headers || {}) };
	};
	const readChatGptCookieHeader = async () => {
		try {
			if (!chrome.cookies?.getAll) {
				return '';
			}
			const cookies = await chrome.cookies.getAll({ url: 'https://chatgpt.com/' });
			return cookies
				.filter((cookie) => cookie?.name)
				.map((cookie) => `${cookie.name}=${cookie.value || ''}`)
				.join('; ');
		} catch (error) {
			return '';
		}
	};
const readChatGptAuthorizationHeaderFromSession = async () => {
		if (chatgptAuthorizationHeader) {
			return chatgptAuthorizationHeader;
		}
  const storageArea = chrome.storage?.session || chrome.storage?.local;
  const sessionObj = await storageArea
    .get([CHATGPT_AUTH_HEADER_SESSION_KEY])
    .catch(() => ({}));
  const authorization = sessionObj?.[CHATGPT_AUTH_HEADER_SESSION_KEY];
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    chatgptAuthorizationHeader = authorization;
    return authorization;
  }
  return '';
};
	const readChatGptRequestTrace = async () => {
		const { kaitoChatGptRequestDebug = [] } = await chrome.storage.local.get([
			'kaitoChatGptRequestDebug',
		]);
		const storageArea = chrome.storage?.session || chrome.storage?.local;
		const { kaitoChatGptRequestTrace = [] } = await storageArea
			.get(['kaitoChatGptRequestTrace'])
			.catch(() => ({}));
		const now = Date.now();
		return [...kaitoChatGptRequestDebug, ...kaitoChatGptRequestTrace]
			.filter((entry) => !entry?.at || now - entry.at < 10 * 60 * 1000)
			.reverse();
	};
	const getChatGptAuthorizationHeaderFromTrace = (trace = []) => {
		const entry = trace.find((item) => {
			const headers = item?.headers || {};
			return !!headers.Authorization || !!headers.authorization;
		});
		const headers = entry?.headers || {};
		const authorization = headers.Authorization || headers.authorization || '';
		if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
			chatgptAuthorizationHeader = authorization;
			return authorization;
		}
		return '';
	};
	const getActiveTemplateDataSource = () =>
	  String(activeTemplate?.dataSource || activeTemplate?.dataSourceId || '').toLowerCase();
	const isBinanceDataSourceName = (dataSource) => {
	  const normalized = String(dataSource || '').toLowerCase();
	  return normalized === 'binance' || normalized.startsWith('binance_');
	};
		const isBinanceTargetUrl = (url) => {
		  const normalized = String(url || '')
		    .toLowerCase()
		    .replace(/\\\//g, '/')
		    .replace(/\\\./g, '.');
		  return normalized.includes('binance.com/bapi/');
		};
	const binanceEndpointKey = (value) => {
	  const normalized = String(value || '')
	    .toLowerCase()
	    .replace(/\\\//g, '/')
	    .replace(/\\\./g, '.');
	  if (normalized.includes('/bapi/accounts/v1/private/account/get-user-base-info')) {
	    return 'user-base-info';
	  }
	  if (normalized.includes('/bapi/asset/v3/private/asset-service/wallet/wallet-group')) {
	    return 'wallet-group';
	  }
	  if (normalized.includes('/bapi/asset/v2/private/asset-service/wallet/balance')) {
	    return 'wallet-balance';
	  }
	  if (
	    normalized.includes('/bapi/asset/v2/private/asset-service/asset/get-user-asset') ||
	    normalized.includes('/bapi/asset/v3/private/asset-service/asset/get-user-asset')
	  ) {
	    return 'spot-assets';
	  }
	  if (normalized.includes('/bapi/futures/v4/private/future/user-data/user-position')) {
	    return 'futures-position';
	  }
	  return '';
	};
	const binanceRequestMatchesTemplate = (requestUrl, templateRequest) => {
	  if (!isBinanceTargetUrl(requestUrl) || !templateRequest?.url) {
	    return false;
	  }
	  const templateKey = binanceEndpointKey(templateRequest.url);
	  if (!templateKey || binanceEndpointKey(requestUrl) !== templateKey) {
	    return false;
	  }
	  if (templateKey !== 'wallet-group' && templateKey !== 'wallet-balance') {
	    return true;
	  }
	  try {
	    const parsedUrl = new URL(requestUrl);
	    if (templateKey === 'wallet-group') {
	      return (
	        parsedUrl.searchParams.has('quoteAsset') &&
	        parsedUrl.searchParams.get('needAlphaAsset') === 'true' &&
	        parsedUrl.searchParams.get('needEuFuture') === 'true'
	      );
	    }
	    return (
	      parsedUrl.searchParams.has('quoteAsset') &&
	      parsedUrl.searchParams.get('needBalanceDetail') === 'true' &&
	      parsedUrl.searchParams.get('needEuFuture') === 'true'
	    );
	  } catch {
	    return false;
	  }
	};
	const requestInfoMatchesTemplateRequest = (requestInfo, templateRequest) => {
	  if (!requestInfo?.url || !templateRequest?.url) {
	    return false;
	  }
	  if (
	    templateRequest?.method &&
	    requestInfo?.method &&
	    String(templateRequest.method).toUpperCase() !==
	      String(requestInfo.method).toUpperCase()
	  ) {
	    return false;
	  }
	  if (requestInfo.templateRequestUrl === templateRequest.url) {
	    return true;
	  }
  if (binanceRequestMatchesTemplate(requestInfo.url, templateRequest)) {
    return true;
  }
  const checkRes = checkIsRequiredUrl({
    requestUrl: requestInfo.url,
    requiredUrl: templateRequest.url,
    urlType: templateRequest.urlType,
    queryParams: templateRequest.queryParams,
  });
  if (checkRes) {
    return true;
  }
  if (getActiveTemplateDataSource() !== 'chatgpt') {
    return false;
  }
  return (
    (requestInfo.url.includes('/backend-api/subscriptions?') &&
      templateRequest.url.includes('/backend-api/subscriptions')) ||
    (requestInfo.url.includes('/backend-api/wham/usage') &&
      templateRequest.url.includes('/backend-api/wham/usage'))
  );
};
const findCapturedTargetEntry = (templateRequest) =>
  Object.entries(requestsMap).find(([, requestInfo]) => {
    return requestInfo?.isTarget === 1 && requestInfoMatchesTemplateRequest(requestInfo, templateRequest);
  });
const hydrateMissingChatGptRequestsFromTrace = async (requests) => {
  if (getActiveTemplateDataSource() !== 'chatgpt') {
    return;
  }
  const trace = await readChatGptRequestTrace();
  const authorizationHeader =
    getChatGptAuthorizationHeader() ||
    (await readChatGptAuthorizationHeaderFromSession()) ||
    getChatGptAuthorizationHeaderFromTrace(trace);
  const hydrationDebug = {
    at: Date.now(),
    authorizationPresent: !!authorizationHeader,
    requestCount: Array.isArray(requests) ? requests.length : 0,
    traceCount: 0,
    hydrated: [],
    skipped: [],
  };
	  if (!authorizationHeader) {
	    await chrome.storage.local.set({ kaitoChatGptHydrationDebug: hydrationDebug });
	    return;
	  }
	  const cookieHeader = await readChatGptCookieHeader();
	  hydrationDebug.cookiePresent = !!cookieHeader;
	  const fallbackHeaders = {
	    ...getChatGptHeaderFallback(),
	    Authorization: authorizationHeader,
	    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
	  };
  const normalizeChatGptHeaders = (headers = {}) => {
    const normalized = { ...headers };
    const authorization = normalized.Authorization || normalized.authorization || authorizationHeader;
    if (authorization) {
      normalized.Authorization = authorization;
    }
    delete normalized.authorization;
    const cookie = normalized.Cookie || normalized.cookie || cookieHeader;
    if (cookie) {
      normalized.Cookie = cookie;
    }
    delete normalized.cookie;
    return normalized;
  };
  const normalizeChatGptTargetUrl = (expression) => {
    let value = String(expression || '').trim();
    value = value.replace(/\(\?:\\\?\.\*\)\?\$$/, '');
    value = value.replace(/\$$/, '');
    value = value.replace(/\\\./g, '.');
    value = value.replace(/\\\//g, '/');
    return /^https:\/\/chatgpt\.com\/backend-api\/wham\/usage$/.test(value)
      ? value
      : '';
  };
  hydrationDebug.traceCount = trace.length;
  for (const request of requests) {
    if (!request?.url || request.name === 'first') {
      continue;
    }
    const alreadyCapturedKey = Object.keys(requestsMap).find(
      (key) => requestsMap[key]?.templateRequestUrl === request.url
    );
	    if (alreadyCapturedKey) {
	      const headers = requestsMap[alreadyCapturedKey]?.headers || {};
	      storeRequestsMap(alreadyCapturedKey, {
	        headers: normalizeChatGptHeaders({
	          ...fallbackHeaders,
	          ...headers,
	        }),
	        isTarget: 1,
	      });
      hydrationDebug.hydrated.push({
        templateRequestUrl: request.url,
        url: requestsMap[alreadyCapturedKey]?.url,
        mode: 'updated_existing',
      });
      continue;
    }
    const traceEntry = trace.find((entry) => {
      const requestUrl = entry?.url;
      if (typeof requestUrl !== 'string') {
        return false;
      }
      const checkRes = checkIsRequiredUrl({
        requestUrl,
        requiredUrl: request.url,
        urlType: request.urlType || 'REGX',
        queryParams: request.queryParams,
      });
      return (
        checkRes ||
        (requestUrl.includes('/backend-api/subscriptions?') &&
          request.url.includes('/backend-api/subscriptions')) ||
        (requestUrl.includes('/backend-api/wham/usage') &&
          request.url.includes('/backend-api/wham/usage'))
      );
    });
	    const traceHeaders = traceEntry?.headers || {};
	    const chatGptHeaders = normalizeChatGptHeaders({
	      ...fallbackHeaders,
	      ...traceHeaders,
	    });
	    if (!traceEntry?.url) {
	      const syntheticUrl = normalizeChatGptTargetUrl(request.url);
	      if (syntheticUrl) {
	        const requestId = `kaito-chatgpt-synthetic-${request.name || syntheticUrl}`;
	        storeRequestsMap(requestId, {
	          headers: chatGptHeaders,
	          method: request.method || 'GET',
	          url: syntheticUrl,
	          requestId,
	          templateRequestUrl: request.url,
	          type: 'xmlhttprequest',
	          isTarget: 1,
	        });
	        hydrationDebug.hydrated.push({
	          templateRequestUrl: request.url,
	          url: syntheticUrl,
	          mode: 'synthetic',
	        });
	        continue;
	      }
	      hydrationDebug.skipped.push({ url: request.url, reason: 'trace_missing' });
	      continue;
	    }
	    const requestId = `kaito-chatgpt-hydrated-${request.name || request.url}`;
	    storeRequestsMap(requestId, {
	      headers: chatGptHeaders,
	      method: request.method || 'GET',
	      url: traceEntry.url,
      requestId,
      templateRequestUrl: request.url,
      type: 'xmlhttprequest',
      isTarget: 1,
    });
    hydrationDebug.hydrated.push({
      templateRequestUrl: request.url,
      url: traceEntry.url,
    });
  }
  await chrome.storage.local.set({ kaitoChatGptHydrationDebug: hydrationDebug });
};
const handlerForSdk = async (processAlgorithmReq, operation) => {
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKDappTabId: dappTabId,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
  ]);
  const { activeRequestAttestation: lastActiveRequestAttestationStr } =
    await chrome.storage.local.get(['activeRequestAttestation']);
  if (processAlgorithmReq && lastActiveRequestAttestationStr) {
    processAlgorithmReq({
      reqMethodName: 'stop',
    });
  }
  if (padoZKAttestationJSSDKBeginAttest) {
    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'padoZKAttestationJSSDKXFollowerCount',
      'activeRequestAttestation',
    ]);
    let desc = `The user ${operation} the attestation`;
    let resParams = { result: false };
    if (!resParams.result) {
      resParams.errorData = {
        title: '',
        desc: desc,
        code: '00004',
      };
      resParams.reStartFlag = true;
    }
    try {
      sendMsgToSdk({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: resParams,
      });
    } catch (error) {
      console.log('handlerForSdk error:', handlerForSdk);
    }
  }
};

const extraRequestFn = async () => {
  // { currentWindow: true }
  const tabs = await chrome.tabs.query({});
  const dataSourcePageTabObj = tabs.find((i) => i.id === dataSourcePageTabId);
  const pathname = new URL(dataSourcePageTabObj.url).pathname;
  const arr = pathname.split('/');
  const chatgptQuestionSessionId = arr[arr.length - 1];
  const requestUrl = 'https://chatgpt.com/backend-api/conversation';
  const fullRequestUrl = `${requestUrl}/${chatgptQuestionSessionId}`;

  // const storageRes = await chrome.storage.local.get(requestUrl);
  const storageRes = requestsMap;
  const activeInfo = Object.values(storageRes).find(
    (i) => i.url === requestUrl
  );
  try {
    const requestRes = await customFetch(fullRequestUrl, {
      method: 'GET',
      // headers: JSON.parse(storageRes[requestUrl]).headers,
      headers: activeInfo.headers,
    });

    const messageIds = [];
    Object.keys(requestRes.mapping).forEach((mK) => {
      const parts = requestRes.mapping[mK]?.message?.content?.parts;
      if (parts && parts[0]) {
        messageIds.push(mK);
      }
    });
    const obj = {
      request: {
        url: fullRequestUrl,
        method: 'GET',
        headers: {
          host: 'chatgpt.com',
        },
      },
      response: {
        messageIds,
      },
    };
    chrome.storage.local.set({
      [`${requestUrl}-extra`]: JSON.stringify(obj),
    });
    RequestsHasCompleted = true;
  } catch (e) {
    console.log('fetch chatgpt conversation error', e);
  }
};
const eventReportGenerateFn = async (rawData) => {
  var eventInfo = {
    eventType: 'ATTESTATION_GENERATE',
    rawData,
  };
  eventReport(eventInfo);
};
const handle00013 = async () => {
  let rawData = {};
  let baseRawData = {
    status: 'FAILED',
    reason: 'Something went wrong',
    detail: {
      code: '00013',
      desc: 'Target data missing',
    },
  };
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKAttestationPresetParams,
    activeRequestAttestation,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'activeRequestAttestation',
  ]);
  if (padoZKAttestationJSSDKBeginAttest) {
    if (padoZKAttestationJSSDKAttestationPresetParams) {
      const parsedActiveRequestAttestation = JSON.parse(
        padoZKAttestationJSSDKAttestationPresetParams
      );
      if (
        !reportRequestIds.includes(parsedActiveRequestAttestation.requestid)
      ) {
        reportRequestIds.push(parsedActiveRequestAttestation.requestid);
        const userAddress = parsedActiveRequestAttestation?.ext
          ?.appSignParameters
          ? JSON.parse(parsedActiveRequestAttestation.ext.appSignParameters)
              .userAddress
          : '';

        rawData = {
          source: parsedActiveRequestAttestation.dataSourceId,
          schemaType: parsedActiveRequestAttestation.schemaType,
          sigFormat: parsedActiveRequestAttestation.sigFormat,
          attestOrigin: parsedActiveRequestAttestation.attestOrigin,
          event: parsedActiveRequestAttestation.attestOrigin,
          templateId: parsedActiveRequestAttestation.attTemplateID,
          address: userAddress,
          ...baseRawData,
        };
        if (parsedActiveRequestAttestation.event) {
          rawData.event = parsedActiveRequestAttestation.event;
        }
        rawData = await addSDKParamsToReportParamsFn(rawData);
        eventReportGenerateFn(rawData);
      }
    }
  } else {
    if (activeRequestAttestation) {
      const parsedActiveRequestAttestation = JSON.parse(
        activeRequestAttestation
      );
      if (
        !reportRequestIds.includes(parsedActiveRequestAttestation.requestid)
      ) {
        reportRequestIds.push(parsedActiveRequestAttestation.requestid);
        rawData = {
          source: parsedActiveRequestAttestation.source,
          schemaType: parsedActiveRequestAttestation.schemaType,
          sigFormat: parsedActiveRequestAttestation.sigFormat,
          address: parsedActiveRequestAttestation?.address,
          ...baseRawData,
        };
        if (parsedActiveRequestAttestation.event) {
          rawData.event = parsedActiveRequestAttestation.event;
        }
        eventReportGenerateFn(rawData);
      }
    }
  }
  errorFn({
    title:
      'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
    desc: 'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
    code: '00013',
  });
};

const handleDataSourcePageDialogTimeout = async (processAlgorithmReq) => {
  let rawData = {};
  let baseRawData = {
    status: 'FAILED',
    reason: 'Something went wrong',
    detail: {
      code: '00014',
      desc: 'The verification process timed out.',
    },
  };
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKAttestationPresetParams,
    activeRequestAttestation,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'activeRequestAttestation',
  ]);
  const eventReportFn = async (rawData) => {
    const { beginAttest, getAttestationResultRes } =
      await chrome.storage.local.get([
        'beginAttest',
        'getAttestationResultRes',
      ]);

    if (beginAttest === '1') {
      rawData.getAttestationResultRes = getAttestationResultRes;
    }

    if (!getAttestationResultRes) {
      var eventInfo = {
        eventType: 'ATTESTATION_GENERATE',
        rawData,
      };
      eventReport(eventInfo);
    }
  };
  if (padoZKAttestationJSSDKBeginAttest) {
    if (padoZKAttestationJSSDKAttestationPresetParams) {
      const parsedActiveRequestAttestation = JSON.parse(
        padoZKAttestationJSSDKAttestationPresetParams
      );
      if (
        !reportRequestIds.includes(parsedActiveRequestAttestation.requestid)
      ) {
        reportRequestIds.push(parsedActiveRequestAttestation.requestid);
        const userAddress = parsedActiveRequestAttestation?.ext
          ?.appSignParameters
          ? JSON.parse(parsedActiveRequestAttestation.ext.appSignParameters)
              .userAddress
          : '';
        // TODO-event
        rawData = {
          source: parsedActiveRequestAttestation.dataSourceId,
          schemaType: parsedActiveRequestAttestation.schemaType,
          sigFormat: parsedActiveRequestAttestation.sigFormat,
          attestOrigin: parsedActiveRequestAttestation.attestOrigin,
          event: parsedActiveRequestAttestation.attestOrigin,
          templateId: parsedActiveRequestAttestation.attTemplateID,
          address: userAddress,
          ...baseRawData,
        };
        if (parsedActiveRequestAttestation.event) {
          rawData.event = parsedActiveRequestAttestation.event;
        }
        rawData = await addSDKParamsToReportParamsFn(rawData);
        eventReportFn(rawData);
      }
    }
  } else {
    if (activeRequestAttestation) {
      const parsedActiveRequestAttestation = JSON.parse(
        activeRequestAttestation
      );
      if (
        !reportRequestIds.includes(parsedActiveRequestAttestation.requestid)
      ) {
        reportRequestIds.push(parsedActiveRequestAttestation.requestid);
        rawData = {
          source: parsedActiveRequestAttestation.source,
          schemaType: parsedActiveRequestAttestation.schemaType,
          sigFormat: parsedActiveRequestAttestation.sigFormat,
          address: parsedActiveRequestAttestation?.address,
          ...baseRawData,
        };
        if (parsedActiveRequestAttestation.event) {
          rawData.event = parsedActiveRequestAttestation.event;
        }
        eventReportFn(rawData);
      }
    }
  }

  processAlgorithmReq({
    reqMethodName: 'stop',
  });
  errorFn({
    title: 'Request Timed Out',
    desc: 'The process did not respond within 2 minutes. Please try again later.',
    code: '00014',
  });
};

// inject-dynamic
export const pageDecodeMsgListener = async (
  request,
  sender,
  sendResponse,
  password,
  port,
  hasGetTwitterScreenName,
  processAlgorithmReq
) => {
  const { name, params, operation } = request;
  console.log('pageDecodeMsgListener');
  if (name === 'init') {
    activeTemplate = {};
    activeTemplate = {
      ...params,
      dataSource: params?.dataSource || params?.dataSourceId,
    };
    resetVarsFn();
    await chrome.storage.local.set({
      kaitoPageDecodeInitDebug: {
        at: Date.now(),
        stage: 'init_received',
        dataSource: activeTemplate.dataSource,
        hasDatasourceTemplate: Boolean(activeTemplate?.datasourceTemplate),
        requestCount: activeTemplate?.datasourceTemplate?.requests?.length || 0,
      },
    });
  }
  if (activeTemplate.dataSource) {
    let {
      dataSource,
      jumpTo,
      datasourceTemplate: { requests },
    } = activeTemplate;

    const checkSDKTargetRequestFn = async (requestId, templateRequestUrl) => {
      const {
        datasourceTemplate: { requests, responses },
        additionParamsObj,
        extendedParams,
      } = activeTemplate;
      const extendedParamsObj = extendedParams
        ? JSON.parse(extendedParams)
        : {};

      const thisRequestUrlIdx = requests.findIndex(
        (r) => r.url === templateRequestUrl
      );
      const thisRequestObj = requests[thisRequestUrlIdx];
      const thisResponseObj = responses[thisRequestUrlIdx];

      const { url, urlType, queryParams, ignoreResponse } = thisRequestObj;
      const bodyMatchesTemplate = (requestInfo, templateRequest) => {
        const matchKeys = templateRequest?.matchReqBodyKey;
        if (!Array.isArray(matchKeys) || matchKeys.length === 0) {
          return true;
        }
        const body = requestInfo?.body;
        if (!body || typeof body !== 'object') {
          return false;
        }
        return matchKeys.every(({ key, value }) => {
          if (!key || !(key in body)) {
            return false;
          }
          return value === undefined || String(body[key]) === String(value);
        });
      };
	      const thisRequestUrlFoundFlag = Object.values(requestsMap).find(
	        (v) =>
	          v.templateRequestUrl === url &&
	          v.isTarget === 1 &&
	          (!thisRequestObj?.method ||
	            !v?.method ||
	            String(thisRequestObj.method).toUpperCase() ===
	              String(v.method).toUpperCase()) &&
	          bodyMatchesTemplate(v, thisRequestObj)
	      );

      if (!thisRequestUrlFoundFlag) {
        if (ignoreResponse) {
	          Object.values(requestsMap).some((sInfo) => {
	            if (sInfo.templateRequestUrl === url && sInfo.headers) {
	              if (
	                thisRequestObj?.method &&
	                sInfo?.method &&
	                String(thisRequestObj.method).toUpperCase() !==
	                  String(sInfo.method).toUpperCase()
	              ) {
	                return false;
	              }
	              if (!bodyMatchesTemplate(sInfo, thisRequestObj)) {
	                return false;
	              }
              sInfo.isTarget = 1;
              return true;
            }
          });
        } else {
          const matchRequestIdArr = Object.keys(requestsMap).filter((key) => {
            const checkRes = checkIsRequiredUrl({
              requestUrl: requestsMap[key].url,
              requiredUrl: url,
              urlType: urlType || 'REGX',
              queryParams: queryParams,
            });
	            return (
	              checkRes &&
	              (!thisRequestObj?.method ||
	                !requestsMap[key]?.method ||
	                String(thisRequestObj.method).toUpperCase() ===
	                  String(requestsMap[key].method).toUpperCase()) &&
	              bodyMatchesTemplate(requestsMap[key], thisRequestObj)
	            );
	          });
          for (const matchRequestId of [...matchRequestIdArr]) {
            if (requestsMap[matchRequestId]?.isTarget === 1) {
              break;
            } else if (requestsMap[matchRequestId]?.isTarget === 2) {
            } else {
              let jsonPathArr = thisResponseObj.conditions.subconditions.map(
                (i) => {
                  if (i?.op === 'MATCH_ONE') {
                    return i;
                  } else {
                    return isObject(i.field) && i.field?.field
                      ? i.field.field
                      : i.field;
                  }
                }
              );
              let targetRequestUrl = requestsMap[matchRequestId].url;
              if (activeTemplate?.attTemplateID === templateIdForMonad) {
                // 'https://api.lu.ma/home/get-events?period=past&pagination_limit=1000';
                targetRequestUrl = eventListUrlForMonad(targetRequestUrl); // TODO
              }

              if (
                [templateIdForNilion7Days, templateIdForNilion1Month].includes(
                  activeTemplate?.attTemplateID
                )
              ) {
                const lastBody = requestsMap[matchRequestId].body;
                let newBody = {
                  ...lastBody,
                };
                if (
                  activeTemplate?.attTemplateID === templateIdForNilion1Month
                ) {
                  const newStartTime = getNMonthsBeforeTime(
                    lastBody.endTime,
                    startTimeDistanceForNilion
                  );
                  // console.log('nilion', 'binance time:', lastBody.endTime);
                  // console.log(
                  //   'utc time:',
                  //   getUTCDayLastSecondTime(lastBody.endTime)
                  // );
                  newBody = {
                    ...lastBody,
                    rows: rowForNilion,
                    startTime: newStartTime,
                    direction: '',
                    baseAsset: '',
                    quoteAsset: '',
                    hideCancel: false,
                    queryTimeType: 'INSERT_TIME',
                  };
                } else if (
                  activeTemplate?.attTemplateID === templateIdForNilion7Days
                ) {
                  newBody = {
                    ...lastBody,
                    rows: rowForNilion,
                  };
                }
                storeRequestsMap(matchRequestId, {
                  ...requestsMap[matchRequestId],
                  body: newBody,
                });
              }

              if (
                [
                  templateIdForBinanceEarnHistory,
                  templateIdForBinanceEarnHistoryABalance,
                  templateIdForBinanceEarnHistoryABalance,
                ].includes(activeTemplate?.attTemplateID)
              ) {
                const newRequestMap = updateRequestMapFnForbBinanceEarnHistory(
                  requestsMap[matchRequestId],
                  additionParamsObj
                );
                targetRequestUrl = newRequestMap.url;
                storeRequestsMap(matchRequestId, newRequestMap);
              }

              if (
                [templateIdForReputationPhalaBinanceEarnBalance].includes(
                  activeTemplate?.attTemplateID
                )
              ) {
                const newRequestMap =
                  updateRequestMapFnForReputationPhalaBinanceEarnBalance(
                    requestsMap[matchRequestId],
                    additionParamsObj
                  );
                targetRequestUrl = newRequestMap.url;
                storeRequestsMap(matchRequestId, newRequestMap);
              }
              let matchRequestUrlResult;
              let isTargetUrl = false;
	              if (
	                getActiveTemplateDataSource() === 'claude' ||
	                isBinanceDataSourceName(getActiveTemplateDataSource()) ||
	                isBinanceTargetUrl(targetRequestUrl)
	              ) {
                // Claude.ai and Binance private APIs can be gated when replayed
                // from the extension background, even with captured cookies. The
                // page's own XHR/fetch is the verifiable traffic; do not block
                // readiness on a background preflight that cannot reproduce the
                // page context.
                storeRequestsMap(matchRequestId, { isTarget: 1 });
                break;
              }
              if (requestsMap[matchRequestId].type === 'main_frame') {
                matchRequestUrlResult = await extraRequestHtmlFn({
                  ...requestsMap[matchRequestId],
                  header: requestsMap[matchRequestId].headers,
                  url: targetRequestUrl,
                });
                if (matchRequestUrlResult) {
                  isTargetUrl = checkResHtmlIsMatchConditionFn(
                    jsonPathArr,
                    matchRequestUrlResult
                  );
                  if (isTargetUrl) {
                    storeRequestsMap(matchRequestId, { isTarget: 1 });
                    break;
                  }
                }
              } else {
                matchRequestUrlResult = await extraRequestFn2({
                  ...requestsMap[matchRequestId],
                  header: requestsMap[matchRequestId].headers,
                  url: targetRequestUrl,
                });
              }

              if (
                matchRequestUrlResult &&
                activeTemplate?.attTemplateID === templateIdForTwitch
              ) {
                let formarRes = formatJsonArrFnForTwitch(
                  jsonPathArr,
                  requestsMap[matchRequestId],
                  thisRequestObj.matchReqBodyKey,
                  matchRequestUrlResult
                );
                if (formarRes?.checkRes) {
                  jsonPathArr = formarRes.jsonpath;
                  isTargetUrl = true;
                }
              } else {
                isTargetUrl = checkResIsMatchConditionFn(
                  jsonPathArr,
                  matchRequestUrlResult
                );
              }
              const notMetHandler = async () => {
                const notMetCode = '00104';
                const netMetMsg = await getErrorMsgFn(
                  activeTemplate.attestationType,
                  notMetCode
                );
                handleEnd(netMetMsg);
                sendMsgToSdk({
                  type: 'padoZKAttestationJSSDK',
                  name: 'startAttestationRes',
                  params: {
                    result: false,
                    errorData: {
                      code: notMetCode,
                    },
                  },
                });
              };
              if (
                matchRequestUrlResult &&
                activeTemplate?.attTemplateID === templateIdForMonad
              ) {
                isTargetUrl = await checkTargetRequestFnForMonad(
                  targetRequestUrl,
                  matchRequestUrlResult,
                  requestsMap[matchRequestId],
                  notMetHandler
                );
              }
              if (
                matchRequestUrlResult &&
                activeTemplate?.attTemplateID ===
                  templateIdForReputaionPhalaCvmList &&
                targetRequestUrl.includes(phalaCvmListRequestUrl)
              ) {
                isTargetUrl =
                  await checkTargetRequestFnForReputationPhalaCvmList(
                    matchRequestUrlResult,
                    notMetHandler
                  );
              }

              if (
                matchRequestUrlResult &&
                activeTemplate?.attTemplateID ===
                  templateIdForReputationPhalaBinanceEarnBalance
              ) {
                isTargetUrl =
                  await checkTargetRequestFnForReputationPhalaBinanceEarnBalance(
                    matchRequestUrlResult,
                    notMetHandler,
                    additionParamsObj
                  );
              }
              if (
                matchRequestUrlResult &&
                activeTemplate?.attTemplateID ===
                  templateIdForBinanceSomeTokenBalance &&
                targetRequestUrl.includes(
                  templateIdForBinanceSomeTokenBalanceRequestUrl
                )
              ) {
                isTargetUrl =
                  await checkTargetRequestFnForBinanceSomeTokenBalance(
                    matchRequestUrlResult,
                    notMetHandler,
                    extendedParamsObj
                  );
              }

              if (
                matchRequestUrlResult &&
                activeTemplate?.attTemplateID ===
                  templateIdForOkxSomeTokenBalance &&
                targetRequestUrl.includes(
                  templateIdForOkxSomeTokenBalanceRequestUrl
                )
              ) {
                isTargetUrl = await checkTargetRequestFnForOkxSomeTokenBalance(
                  matchRequestUrlResult,
                  notMetHandler,
                  extendedParamsObj
                );
              }

              if (
                matchRequestUrlResult &&
                activeTemplate?.attTemplateID ===
                  templateIdForCoinstatsSomeTokenBalance
              ) {
                isTargetUrl =
                  await checkTargetRequestFnForCoinstatsSomeTokenBalance(
                    matchRequestUrlResult,
                    notMetHandler,
                    extendedParamsObj
                  );
              }

              if (isTargetUrl) {
                storeRequestsMap(matchRequestId, { isTarget: 1 });
                break;
              } else {
                if (requestsMap[matchRequestId]) {
                  storeRequestsMap(matchRequestId, { isTarget: 2 });
                }
              }
            }
          }
        }
      }
    };
	    const checkWebRequestIsReadyFn = async () => {
	      const checkReadyStatusFn = async () => {
	        let {
          dataSource,
          datasourceTemplate: { requests, responses },
          sdkVersion,
        } = activeTemplate;

	        const interceptorRequests = requests.filter((r) => r.name !== 'first');
	        const interceptorUrlArr = interceptorRequests.map((i) => i.url);
	        if (dataSource === 'chatgpt') {
	          await hydrateMissingChatGptRequestsFromTrace(requests);
	        }
	        const writeBinanceReadinessDebug = async (extra = {}) => {
	          if (
	            !isBinanceDataSourceName(dataSource) &&
	            !interceptorUrlArr.some(isBinanceTargetUrl)
	          ) {
	            return;
	          }
	          await chrome.storage.local.set({
	            kaitoBinanceReadinessDebug: {
	              at: Date.now(),
	              dataSource,
	              targetCount: interceptorRequests.length,
	              requestCount: Object.keys(requestsMap).length,
	              targets: interceptorRequests.map((request) => {
	                const matches = Object.values(requestsMap).filter((requestInfo) => {
	                  if (
	                    request.method &&
	                    requestInfo?.method &&
	                    String(request.method).toUpperCase() !==
	                      String(requestInfo.method).toUpperCase()
	                  ) {
	                    return false;
	                  }
	                  if (binanceRequestMatchesTemplate(requestInfo.url, request)) {
	                    return true;
	                  }
	                  return checkIsRequiredUrl({
	                    requestUrl: requestInfo.url,
	                    requiredUrl: request.url,
	                    urlType: request.urlType,
	                    queryParams: request.queryParams,
	                  });
	                });
	                return {
	                  method: request.method || null,
	                  url: request.url,
	                  matchCount: matches.length,
	                  hasTarget: matches.some((item) => item.isTarget === 1),
	                  hasHeaders: matches.some((item) => !!item.headers),
	                  hasBody: matches.some((item) => !!item.body),
	                  methods: [...new Set(matches.map((item) => item.method).filter(Boolean))],
	                  targetMethods: [
	                    ...new Set(
	                      matches
	                        .filter((item) => item.isTarget === 1)
	                        .map((item) => item.method)
	                        .filter(Boolean)
	                    ),
	                  ],
	                };
	              }),
	              ...extra,
	            },
	          });
	        };

	        const storageObj = requestsMap;
	        const storageArr = Object.values(storageObj);

        if (
          interceptorUrlArr.length > 0 &&
          storageArr.length >= interceptorUrlArr.length
        ) {
          let captureNum = 0;
	          let f = interceptorRequests.every(async (r) => {
	            const activeRequestInfo = Object.values(requestsMap).find(
	              (rInfo) => {
	                if (
	                  r.method &&
	                  rInfo?.method &&
	                  String(r.method).toUpperCase() !==
	                    String(rInfo.method).toUpperCase()
	                ) {
	                  return false;
	                }
	                const checkRes = checkIsRequiredUrl({
	                  requestUrl: rInfo.url,
	                  requiredUrl: r.url,
                  urlType: r.urlType,
                  queryParams: r.queryParams,
                });
                return checkRes || binanceRequestMatchesTemplate(rInfo.url, r);
                // return matchReg(r.url, rInfo.url);
              }
            );
            if (activeRequestInfo) {
              let targetRequestId = activeRequestInfo.requestId;
              const sRrequestObj = requestsMap[targetRequestId] || {};
              // console.log('sRrequestObj', storageObj, url, sRrequestObj, r);
              chatgptHasLogin = hasAuthorizationHeader(sRrequestObj?.headers);
              const headersFlag =
                !r.headers || (!!r.headers && !!sRrequestObj.headers);
              const bodyFlag = !r.body || (!!r.body && !!sRrequestObj.body);
              const cookieFlag =
                !r.cookies ||
                (!!r.cookies &&
                  !!sRrequestObj.headers &&
                  !!sRrequestObj.headers.Cookie);

              if (activeRequestInfo && headersFlag && bodyFlag && cookieFlag) {
                captureNum += 1;
              }
              return activeRequestInfo && headersFlag && bodyFlag && cookieFlag;
            } else {
              return false;
            }
          });
          f = captureNum === interceptorRequests.length;

	          let fl = false;
	          let allRequestUrlFoundFlag = false;
	          if (sdkVersion) {
	            allRequestUrlFoundFlag = interceptorUrlArr.every((url) => {
	              const templateRequest = interceptorRequests.find((r) => r.url === url);
	              const curFlag = Object.values(requestsMap).find((sInfo) => {
	                if (
	                  sInfo.isTarget !== 1 ||
	                  (sInfo.templateRequestUrl !== url &&
	                    !binanceRequestMatchesTemplate(sInfo.url, templateRequest))
	                ) {
	                  return false;
	                }
	                if (
	                  templateRequest?.method &&
	                  sInfo?.method &&
	                  String(templateRequest.method).toUpperCase() !==
	                    String(sInfo.method).toUpperCase()
	                ) {
	                  return false;
	                }
	                return true;
	              });
	              return !!curFlag;
	            });

            // const allRequestUrlFoundFlag = Object.values(requestsMap).some(
            //   (sInfo) => {
            //     if (
            //       sInfo.templateRequestUrl.includes('get_creator_channels') &&
            //       sInfo.headers &&
            //       sInfo.body
            //     ) {
            //       sInfo.isTarget = 1;
            //       return true;
            //     }
            //   }
            // );
            fl = f && !!allRequestUrlFoundFlag;
          } else {
            fl = f;
          }

	          await writeBinanceReadinessDebug({
	            captured: captureNum,
	            basicReady: f,
	            allTargetsFound: sdkVersion ? !!allRequestUrlFoundFlag : null,
	            readyBeforeSpecialCase: fl,
	          });
	          if (fl) {
            if (dataSource === 'chatgpt') {
              // Two-stage serialization: wait for preAlgorithmFn's offline
              // pre-generation to reach RUNNING_PAUSE (preAlgorithmStatus==='1')
              // before the readiness-driven online run (startPageDecodeAttestationFn)
              // starts, so the two do not collide ("can not re-run online").
              // With the upstream capture fixes in place (onCompleted <all_urls>,
              // RequestsHasCompleted set directly, conversation-extra guard) the
              // offline run is no longer disrupted and can reach the pause.
              // Single-stage online-only never completes for chatgpt (times out
              // even at 8 min), so this pre-run gate is required.
              fl =
                !!f &&
                chatgptHasLogin &&
                RequestsHasCompleted &&
                preAlgorithmStatus === '1';
            } else {
              if (!formatAlgorithmParams) {
                await formatAlgorithmParamsFn();
              }
            }
	          }
	          return fl;
	        } else {
	          await writeBinanceReadinessDebug({
	            captured: 0,
	            basicReady: false,
	            allTargetsFound: false,
	            reason: 'not_enough_requests',
	          });
	          return false;
	        }
	      };
      isReadyRequest = await checkReadyStatusFn();
      if (isReadyRequest) {
        console.log('all web requests are captured', requestsMap);
        sendMsgToDataSourcePage({
          type: 'pageDecode',
          name: 'webRequestIsReady',
          params: {
            isReady: isReadyRequest,
          },
        });
        const { kaitoPrimusDisallowTabCreate } = await chrome.storage.local.get(
          ['kaitoPrimusDisallowTabCreate']
        );
        if (kaitoPrimusDisallowTabCreate && activeTemplate.sdkVersion) {
          await startPageDecodeAttestationFn();
        }
      }
    };

    const formatAlgorithmParamsFn = async () => {
      let {
        dataSource,
        schemaType,
        datasourceTemplate: { host, requests, responses, calculations, cipher },
        uiTemplate,
        id,
        event,
        category,
        requestid,
        algorithmType,
        sdkVersion,
      } = activeTemplate;
      const form = {
        source: dataSource,
        type: category,
        label: null,
        exUserId: null,
        requestid,
        algorithmType: algorithmType || 'proxytls',
        cipher,
      };
      if (event) {
        form.event = event;
      }
      // "X Followers" required update baseValue
      // console.log('activeTemplate', activeTemplate, dataSource);
      if (activeTemplate.id === '15') {
        form.baseValue =
          activeTemplate.datasourceTemplate.responses[1].conditions.subconditions[1].value;
      }
      if (activeTemplate.requestid) {
        form.requestid = activeTemplate.requestid;
      }
      let aligorithmParams = {};
      if (sdkVersion) {
        aligorithmParams = await assembleAlgorithmParamsForSDK(
          {
            dataSource: activeTemplate.dataSource,
            algorithmType: activeTemplate.algorithmType,
            requestid: activeTemplate.requestid,
            sslCipherSuite: activeTemplate.sslCipherSuite,
            allJsonResponseFlag: activeTemplate.allJsonResponseFlag,
          },
          activeTemplate.ext
        );
      } else {
        aligorithmParams = await assembleAlgorithmParams(form, password);
      }

      let formatRequests = [];
      for (const r of JSON.parse(JSON.stringify(requests))) {
        if (r.queryDetail) {
          continue;
        }

        let { headers, cookies, body, urlType } = r;
        // let formatUrlKey = url;
        let targetRequestId = '';
        if (sdkVersion) {
          targetRequestId =
            Object.values(requestsMap).find(
              (sInfo) =>
                sInfo.templateRequestUrl === r.url && sInfo.isTarget === 1
            )?.requestId || '';
        } else {
          targetRequestId = Object.values(requestsMap).find((rInfo) => {
            const checkRes = checkIsRequiredUrl({
              requestUrl: rInfo.url,
              requiredUrl: r.url,
              urlType: r.urlType,
              queryParams: r.queryParams,
            });
            return checkRes;
            // return matchReg(url, rInfo.url);
          })?.requestId;
          console.log(
            'formatAlgorithmParamsFn-after',
            requestsMap,
            targetRequestId
          );
        }

        const currRequestInfoObj = requestsMap[targetRequestId] || {};
        const {
          headers: curRequestHeader,
          body: curRequestBody,
          queryString,
          url,
        } = currRequestInfoObj;

        const cookiesObj = curRequestHeader
          ? parseCookie(curRequestHeader.Cookie)
          : {};
        let formateHeader = {},
          formateCookie = {},
          formateBody = {};

        if (sdkVersion) {
          Object.assign(r, {
            headers: { ...curRequestHeader },
            body: isObject(curRequestBody)
              ? { ...curRequestBody }
              : curRequestBody,
            url: queryString ? r.url + '?' + queryString : r.url,
          });
        } else {
          if (headers && headers.length > 0) {
            headers.forEach((hk) => {
              if (curRequestHeader) {
                const inDataSourceHeaderKey = Object.keys(
                  curRequestHeader
                ).find((h) => h.toLowerCase() === hk.toLowerCase());
                formateHeader[hk] = curRequestHeader[inDataSourceHeaderKey];
              }
            });
            Object.assign(r, {
              headers: formateHeader,
            });
          }

          if (cookies && cookies.length > 0) {
            cookies.forEach((ck) => {
              formateCookie[ck] = cookiesObj[ck];
            });
            Object.assign(r, {
              cookies: formateCookie,
            });
          }
          if (body && body.length > 0) {
            body.forEach((hk) => {
              formateBody[hk] = curRequestBody[hk];
            });
            Object.assign(r, {
              body: formateBody,
            });
          }
          if (queryString) {
            Object.assign(r, {
              url: r.url + '?' + queryString,
            });
          }
          if ('queryParams' in r) {
            delete r.queryParams;
          }
        }
        formatRequests.push({ ...r, url: r.name === 'first' ? r.url : url });
      }
      // const activeInfo = formatRequests.find((i) => i.headers);
      // const activeHeader = Object.assign({}, activeInfo?.headers);
      // const authInfoName = dataSource + '-auth';
      // await chrome.storage.local.set({
      //   [authInfoName]: JSON.stringify(activeHeader),
      // });
      let formatResponse = JSON.parse(JSON.stringify(responses));
      if (dataSource === 'chatgpt') {
        const { chatGPTExpression } = activeTemplate;
        if (chatGPTExpression) {
          aligorithmParams.chatGPTExpression = chatGPTExpression;
        }
        // Legacy ChatGPT *conversation* verification appended a second request
        // (backend-api/conversation) whose messageIds rewrote formatRequests[1]
        // / formatResponse[1]. The subscription verification is a single GET
        // (backend-api/subscriptions) with no conversation-extra stored, so this
        // block would destructure `{}` (throw) and index a non-existent
        // formatRequests[1]. Only run it when the conversation-extra actually
        // exists and a second request is present; otherwise fall through with
        // the generic single-request params built above.
        const extraRequestSK = `https://chatgpt.com/backend-api/conversation-extra`;
        const extraSObj = await chrome.storage.local.get([extraRequestSK]);
        const extraRequestInfo = extraSObj[extraRequestSK]
          ? JSON.parse(extraSObj[extraRequestSK])
          : null;
        if (
          extraRequestInfo &&
          extraRequestInfo.request &&
          extraRequestInfo.response &&
          Array.isArray(extraRequestInfo.response.messageIds) &&
          formatRequests[1] &&
          formatResponse[1]
        ) {
          const {
            request: {
              url,
              method,
              headers: { host },
            },
            response: { messageIds },
          } = extraRequestInfo;

          formatRequests[1].url = url;
          formatRequests[1].method = method;
          formatRequests[1].headers.host = host;
          let originSubConditionItem =
            formatResponse[1].conditions.subconditions[0];
          formatResponse[1].conditions.subconditions = [];
          messageIds.forEach((mK) => {
            const fieldArr = originSubConditionItem.field.split('.');
            fieldArr[2] = mK;
            formatResponse[1].conditions.subconditions.push({
              ...originSubConditionItem,
              reveal_id: mK,
              field: fieldArr.join('.'),
            });
          });
        }
      } else {
        if (activeTemplate.attTemplateID === templateIdForMonad) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForMonad(formatRequests, formatResponse);
          formatRequests = req;
          formatResponse = res;
        } else if (activeTemplate.attTemplateID === templateIdForTwitch) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForTwitch(formatRequests, formatResponse);
          formatRequests = req;
          formatResponse = res;
        } else if (
          activeTemplate.attTemplateID === templateIdForBinanceEarnHistory
        ) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForBinanceEarnHistory(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        } else if (
          activeTemplate.attTemplateID ===
          templateIdForBinanceEarnHistoryABalance
        ) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForBinanceEarnHistoryABalance(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        } else if (activeTemplate.attTemplateID === templateIdForPhalaAccount) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForPhalaAccount(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        } else if (
          activeTemplate.attTemplateID === templateIdForReputaionPhalaCvmList
        ) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForReputationPhalaCvmList(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        } else if (activeTemplate.attTemplateID === templateIdForPhalaCvmList) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForPhalaCvmList(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        } else if (
          activeTemplate.attTemplateID ===
          templateIdForReputationPhalaBinanceEarnBalance
        ) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForReputationPhalaBinanceEarnBalance(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        } else if (
          activeTemplate.attTemplateID === templateIdForBinanceSomeTokenBalance
        ) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForBinanceSomeTokenBalance(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        } else if (
          activeTemplate.attTemplateID === templateIdForOkxSomeTokenBalance
        ) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForOkxSomeTokenBalance(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        } else if (
          activeTemplate.attTemplateID ===
          templateIdForCoinstatsSomeTokenBalance
        ) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForCoinstatsSpotSomeTokenBalance(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        }
      }
      for (const fr of formatRequests) {
        if (fr.headers) {
          fr.headers['Accept-Encoding'] = 'identity';
        }
        fr.url = fr.url.split('#')[0];
      }
      Object.assign(aligorithmParams, {
        reqType: 'web',
        host: host,
        schemaType,
        requests: formatRequests,
        responses: formatResponse,
        uiTemplate,
        templateId: id,
        calculations,
        PADOSERVERURL,
        padoExtensionVersion,
      });
      if (schemaType?.startsWith('OKX_TOKEN_HOLDING')) {
        aligorithmParams.requests[2].url =
          aligorithmParams.requests[2].url.replace('limit=5', 'limit=100');
      }

      formatAlgorithmParams = aligorithmParams;
      await chrome.storage.local.set({
        kaitoFormatAlgorithmParamsDebug:
          redactAlgorithmParamsForKaitoDebug(aligorithmParams),
        kaitoFormatRequestsMapDebug: redactRequestsMapForKaitoDebug(),
      });
      console.log(
        'formatAlgorithmParams',
        formatAlgorithmParams,
        form,
        activeTemplate
      );
    };

    const startPageDecodeAttestationFn = async () => {
      if (hasStartedPageDecodeAttestation) {
        return;
      }
      if (!formatAlgorithmParams) {
        await formatAlgorithmParamsFn();
      }
      hasStartedPageDecodeAttestation = true;
      await chrome.storage.local.set({
        beginAttest: '1',
      });
      let aligorithmParams = Object.assign(
        { isUserClick: 'true', kaitoStartedAt: Date.now() },
        formatAlgorithmParams
      );
      await chrome.storage.local.set({
        activeRequestAttestation: JSON.stringify(aligorithmParams),
      });
      try {
      await chrome.storage.local.set({
        kaitoLastAlgorithmParamsDebug:
          redactAlgorithmParamsForKaitoDebug(aligorithmParams),
        kaitoPrimusDebug: {
          source: aligorithmParams.source,
          requestCount: aligorithmParams.requests?.length,
          requests: aligorithmParams.requests?.map((request) => ({
            name: request.name,
            url: request.url,
            method: request.method,
            hasHeaders: !!request.headers,
            headerKeys: Object.keys(request.headers || {}),
            hasCookie: !!request.headers?.Cookie || !!request.headers?.cookie,
            hasAuthorization:
              !!request.headers?.Authorization || !!request.headers?.authorization,
            targetRequestId: request.targetRequestId,
          })),
          requestsMap: redactRequestsMapForKaitoDebug(),
        },
        });
      } catch (error) {
        await chrome.storage.local.set({
          kaitoPrimusDebugWriteError: error?.message || String(error),
        });
      }
      console.log('pageDecode-algorithmParams', aligorithmParams);

      var eventInfo = {
        eventType: 'ATTESTATION_START_PAGEDECODE',
        rawData: {
          source: aligorithmParams.source,
          schemaType: aligorithmParams.schemaType,
          sigFormat: aligorithmParams.sigFormat,
          attestationId: aligorithmParams.requestid,
          event: aligorithmParams.event,
          address: aligorithmParams?.user?.address,
          requestid: aligorithmParams.requestid,
          order: '3',
        },
      };
      eventInfo.rawData = await addSDKParamsToReportParamsFn(eventInfo.rawData);
      eventReport(eventInfo);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: JSON.parse(JSON.stringify(aligorithmParams)),
      });
    };

    const preAlgorithmFn = async () => {
      console.log('preAlgorithmFn');
      if (preAlgorithmFlag) {
        return;
      }

      let aligorithmParams = Object.assign(
        { isUserClick: 'false' },
        formatAlgorithmParams
      );
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: JSON.parse(JSON.stringify(aligorithmParams)),
      });
      preAlgorithmFlag = true;
    };
    listenerFn = async (message, sender, sendResponse) => {
      const { padoZKAttestationJSSDKBeginAttest } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
      if (padoZKAttestationJSSDKBeginAttest) {
        const { resType, resMethodName } = message;

        if (
          resType === 'algorithm' &&
          ['getAttestation', 'getAttestationResult'].includes(resMethodName)
        ) {
          await chrome.storage.local.set({
            kaitoPreAlgorithmDebug: {
              at: Date.now(),
              resMethodName,
              hasResponse: Boolean(message.res),
              response: message.res || null,
            },
          });
          if (message.res) {
            const { retcode, isUserClick } = JSON.parse(message.res);
            if (isUserClick === 'false') {
              console.log('preAlgorithm message', message);
              if (resMethodName === 'getAttestation') {
                if (retcode === '0') {
                  if (!preAlgorithmTimer) {
                    preAlgorithmTimer = setInterval(() => {
                      chrome.runtime.sendMessage({
                        type: 'algorithm',
                        method: 'getAttestationResult',
                        params: {},
                      });
                    }, 1000);
                    console.log('preAlgorithmTimer-set', preAlgorithmTimer);
                  }
                } else {
                  errorFn({
                    title: 'Launch failed: unstable connection.',
                    desc: 'Launch failed: unstable connection.',
                    code: '00011',
                  });
                }
              }
              if (resMethodName === 'getAttestationResult') {
                const { retcode, content, retdesc, details, isUserClick } =
                  JSON.parse(message.res);

                if (retcode === '1') {
                  if (details.online.statusDescription === 'RUNNING_PAUSE') {
                    console.log(
                      'preAlgorithmTimer-clear',
                      preAlgorithmTimer,
                      'preAlgorithmStatus',
                      retcode
                    );
                    clearInterval(preAlgorithmTimer);
                    preAlgorithmStatus = retcode;
                    checkWebRequestIsReadyFn();
                  }
                } else if (retcode === '2') {
                  console.log(
                    'preAlgorithmTimer-clear',
                    preAlgorithmTimer,
                    'preAlgorithmStatus',
                    retcode
                  );
                  clearInterval(preAlgorithmTimer);
                  preAlgorithmStatus = retcode;
                  errorFn({
                    title: 'Launch failed: unstable connection.',
                    desc: 'Launch failed: unstable connection.',
                    code: '00011',
                  });
                }
              }
            }
          }
        }
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);

    if (name === 'init') {
      const { configMap } = await chrome.storage.local.get(['configMap']);
      if (configMap) {
        const PRE_ATTEST_PROMOTStr =
          JSON.parse(configMap)?.PRE_ATTEST_PROMOT_V2;
        if (PRE_ATTEST_PROMOTStr) {
          PRE_ATTEST_PROMOT_V2 = JSON.parse(PRE_ATTEST_PROMOTStr);
        }
      }

      operationType = request.operation;
      const currentWindowTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      currExtentionId = currentWindowTabs[0]?.id;
      const interceptorUrlArr = requests
        .filter((r) => r.name !== 'first')
        .map((i) => i.url);
      // const aaa = await chrome.storage.local.get(interceptorUrlArr);
      await chrome.storage.local.remove(interceptorUrlArr);
      console.log('lastStorage-remove', interceptorUrlArr);
      // const bbb = await chrome.storage.local.get(interceptorUrlArr);
      // console.log('555-newattestations', capturedUrlKeyArr, aaa, bbb);

      chrome.webRequest.onBeforeSendHeaders.removeListener(
        onBeforeSendHeadersFn
      );
      chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
      chrome.webRequest.onCompleted.removeListener(onCompletedFn);
      onBeforeSendHeadersFn = async (details) => {
        const isOwnExtensionInitiated = details?.initiator?.startsWith(
          `chrome-extension://${chrome.runtime.id}`
        );
        if (isOwnExtensionInitiated) {
          return;
        }
        if (![-1, dataSourcePageTabId].includes(details.tabId)) {
          return;
        }

        if (details.method === 'OPTIONS') {
          return;
        }
        let {
          dataSource,
          jumpTo,
          datasourceTemplate: { requests },
          sdkVersion,
          attTemplateID,
        } = activeTemplate;

        const {
          url: currRequestUrl,
          requestHeaders,
          method,
          requestId,
        } = details;

        let formatUrlKey = currRequestUrl;
        let addQueryStr = '';
        let needQueryDetail = false;
        let formatHeader = requestHeaders.reduce((prev, curr) => {
          const { name, value } = curr;
          prev[name] = value;
          return prev;
        }, {});
        if (
          currRequestUrl === 'https://chatgpt.com/public-api/conversation_limit'
        ) {
          chatgptHasLogin = hasAuthorizationHeader(formatHeader);
          if (dataSource === 'chatgpt') {
            const tipStr = chatgptHasLogin ? 'toMessage' : 'toLogin';
            console.log('setUIStep-', tipStr);
            sendMsgToDataSourcePage({
              type: 'pageDecode',
              name: 'setUIStep',
              params: {
                step: tipStr,
              },
            });
          }
        }
        let templateRequestUrl = '';

        if (attTemplateID === lumaAccountTemplateId) {
          const checkRes = checkIsRequiredUrl({
            requestUrl: currRequestUrl,
            requiredUrl: lumaAccountTemplateReg,
            urlType: 'REGX',
          });
          if (checkRes) {
            // console.log('formatHeader', formatHeader);
            const userId = getUserIdFromCookie(formatHeader?.Cookie);
            if (userId) {
              const lumaAccountTargetJumpUrl =
                getLumaAccountTargetJumpUrl(userId);
              await chrome.tabs.update(dataSourcePageTabId, {
                url: lumaAccountTargetJumpUrl,
              });
              return;
            } else {
              return;
            }
          }
        }
        let isTarget = requests.some((r) => {
          if (r.name === 'first') {
            return false;
          }
          if (r.queryParams && r.queryParams[0]) {
            const urlStrArr = currRequestUrl.split('?');
            const hostUrl = urlStrArr[0];
            let curUrlWithQuery = r.url === hostUrl;
            if (r.queryDetail) {
              needQueryDetail = r.queryDetail;
            }
            if (r.url === hostUrl) {
              curUrlWithQuery = isUrlWithQueryFn(currRequestUrl, r.queryParams);
            }
            if (curUrlWithQuery) {
              addQueryStr = curUrlWithQuery;
            }
            formatUrlKey = hostUrl;
          }
          const checkRes = checkIsRequiredUrl({
            requestUrl: currRequestUrl,
            requiredUrl: r.url,
            urlType: r.urlType,
            queryParams: r.queryParams,
          });
          if (checkRes) {
            templateRequestUrl = r.url;
          }

          return checkRes;
        });
        if (!isTarget && getActiveTemplateDataSource() === 'chatgpt') {
          const forcedRequest = requests.find((r) => {
            if (!r?.url || r.name === 'first') {
              return false;
            }
            return (
              (currRequestUrl.includes('/backend-api/subscriptions?') &&
                r.url.includes('/backend-api/subscriptions')) ||
              (currRequestUrl.includes('/backend-api/wham/usage') &&
                r.url.includes('/backend-api/wham/usage'))
            );
          });
          if (forcedRequest) {
            isTarget = true;
            templateRequestUrl = forcedRequest.url;
          }
        }
        // console.log(
        //   'captured:',
        //   currRequestUrl,
        //   'isTarget:',
        //   isTarget,
        //   details
        // );
        if (isTarget) {
          if (
            dataSource === 'chatgpt' &&
            !hasAuthorizationHeader(formatHeader)
          ) {
            // ChatGPT subscriptions authenticates with a Bearer header; a
            // cookie-only request (bare 401) must not be captured as the target.
            return;
          }
          console.log('monad-details', details);
          let newCapturedInfo = {
            headers: formatHeader,
            method,
            url: currRequestUrl,
            requestId,
            templateRequestUrl,
            type: details.type, // type: "main_frame"
          };
          if (isBinanceDataSourceName(dataSource) || isBinanceTargetUrl(currRequestUrl)) {
            newCapturedInfo.isTarget = 1;
          }
          if (addQueryStr) {
            newCapturedInfo.queryString = addQueryStr;
          }
          const newCurrRequestObj = storeRequestsMap(
            requestId,
            newCapturedInfo
          );
          if (
            needQueryDetail &&
            formatUrlKey.startsWith(
              'https://api.x.com/1.1/account/settings.json'
            ) &&
            !hasGetTwitterScreenName
          ) {
            const options = {
              headers: newCurrRequestObj.headers,
            };
            hasGetTwitterScreenName = true;
            const res = await fetch(
              formatUrlKey + '?' + newCurrRequestObj.queryString,
              options
            );
            const result = await res.json();
            //need to go profile page
            await chrome.tabs.update(dataSourcePageTabId, {
              url: jumpTo + result.screen_name,
            });
          }
          if (sdkVersion) {
            await checkSDKTargetRequestFn(requestId, templateRequestUrl);
          }
          checkWebRequestIsReadyFn();
        }
      };
      onBeforeRequestFn = async (subDetails) => {
        if (
          subDetails?.initiator?.startsWith(
            `chrome-extension://${chrome.runtime.id}`
          )
        ) {
          return;
        }
        if (![-1, dataSourcePageTabId].includes(subDetails.tabId)) {
          return;
        }
        if (subDetails.method === 'OPTIONS') {
          return;
        }
        let {
          datasourceTemplate: { requests },
        } = activeTemplate;
        const { url: currRequestUrl, requestBody, requestId } = subDetails;

        let formatUrlKey = currRequestUrl;
	          const isTarget = requests.some((r) => {
	            if (r.name === 'first') {
	              return false;
	            }
	            if (
	              r.method &&
	              subDetails.method &&
	              String(r.method).toUpperCase() !==
	                String(subDetails.method).toUpperCase()
	            ) {
	              return false;
	            }
	
	            const checkRes = checkIsRequiredUrl({
	              requestUrl: currRequestUrl,
            requiredUrl: r.url,
            urlType: r.urlType,
            queryParams: r.queryParams,
          });
          return checkRes;
        });
        if (isTarget) {
          if (requestBody && requestBody.raw) {
            const rawBody = requestBody.raw[0];
            if (rawBody && rawBody.bytes) {
              const byteArray = new Uint8Array(rawBody.bytes);
              const bodyText = new TextDecoder().decode(byteArray);
              // console.log(
              //   `targeturl:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
              // );

              storeRequestsMap(requestId, {
                body: JSON.parse(bodyText),
              });
            }
          }
          if (requestBody && requestBody.formData) {
            await storeRequestsMap(requestId, {
              body: requestBody.formData,
              isFormData: true,
            });
          }
        }
      };
      onCompletedFn = async (details) => {
        const isOwnExtensionInitiated = details?.initiator?.startsWith(
          `chrome-extension://${chrome.runtime.id}`
        );
        if (isOwnExtensionInitiated) {
          return;
        }
        if (![-1, dataSourcePageTabId].includes(details.tabId)) {
          return;
        }
        let { dataSource } = activeTemplate;

        if (dataSource === 'chatgpt') {
          const completedRequest = requestsMap[details.requestId];
          if (
            !completedRequest ||
            !hasAuthorizationHeader(completedRequest.headers) ||
            details.statusCode < 200 ||
            details.statusCode >= 300
          ) {
            // Only the authenticated (Bearer) 2xx subscriptions request is the
            // real target; ignore bare 401s / unrelated completions.
            return;
          }
          RequestsHasCompleted = true;
          console.log('onCompletedFn', dataSource, details);
          const interceptorRequests = requests.filter((r) => r.name !== 'first');
          const allTargetsFound = interceptorRequests.every((request) =>
            Object.values(requestsMap).some((requestInfo) => {
              if (!requestInfo?.isTarget) {
                return false;
              }
              return requestInfoMatchesTemplateRequest(requestInfo, request);
            })
          );
          if (!allTargetsFound) {
            checkWebRequestIsReadyFn();
            return;
          }
          console.log('setUIStep-toVerify');
          sendMsgToDataSourcePage({
            type: 'pageDecode',
            name: 'setUIStep',
            params: {
              step: 'toVerify',
            },
          });

          if (!formatAlgorithmParams) {
            await formatAlgorithmParamsFn();
          }
          console.log('RequestsHasCompleted=', RequestsHasCompleted);
          if (!preAlgorithmFlag) {
            // Two-stage flow: preAlgorithmFn runs the offline pre-generation
            // (isUserClick:false); when it reaches RUNNING_PAUSE it sets
            // preAlgorithmStatus='1', which the readiness gate below waits on
            // before startPageDecodeAttestationFn fires the online run.
            preAlgorithmFn();
          }
          checkWebRequestIsReadyFn();
        }
      };

      chrome.webRequest.onBeforeSendHeaders.addListener(
        onBeforeSendHeadersFn,
        { urls: ['<all_urls>'], types: ['xmlhttprequest', 'main_frame', 'other'] },
        ['requestHeaders', 'extraHeaders']
      );
      chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequestFn,
        { urls: ['<all_urls>'], types: ['xmlhttprequest', 'main_frame', 'other'] },
        ['requestBody']
      );

      // interceptorUrlArr entries can be REGX template expressions (e.g. the
      // ChatGPT subscriptions URL `...subscriptions\?account_id=[0-9a-f-]{36}...`),
      // which are NOT valid chrome.webRequest match patterns, so onCompleted
      // silently never fires for them -> RequestsHasCompleted / preAlgorithm
      // never advance -> readiness never met -> 00013. Listen on <all_urls>
      // (symmetric with onBeforeSendHeaders above); onCompletedFn already
      // filters internally by tabId + dataSource + requestsMap membership.
      chrome.webRequest.onCompleted.addListener(
        onCompletedFn,
        { urls: ['<all_urls>'], types: ['xmlhttprequest', 'main_frame', 'other'] },
        ['responseHeaders', 'extraHeaders']
      );
      await chrome.storage.local.set({
        kaitoPageDecodeInitDebug: {
          at: Date.now(),
          stage: 'listeners_registered',
          dataSource,
          requestCount: requests?.length || 0,
        },
      });

      const {
        padoZKAttestationJSSDKDappTabId: dappTabId,
        kaitoPrimusDisallowTabCreate,
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKDappTabId',
        'kaitoPrimusDisallowTabCreate',
      ]);
      let tabCreatedByPado;
      let reloadExistingDataSourcePage = false;
      if (kaitoPrimusDisallowTabCreate && dappTabId) {
        tabCreatedByPado = await chrome.tabs.get(dappTabId).catch(() => null);
        if (!tabCreatedByPado) {
          throw new Error('kaito_auto_tab_create_blocked');
        }
        reloadExistingDataSourcePage = true;
      } else {
        tabCreatedByPado = await chrome.tabs.create({
          url: jumpTo,
        });
      }
      dataSourcePageTabId = tabCreatedByPado.id;
      await chrome.storage.local.set({
        kaitoPageDecodeInitDebug: {
          at: Date.now(),
          stage: 'data_source_tab_ready',
          dataSource,
          requestCount: requests?.length || 0,
          tabId: dataSourcePageTabId,
        },
      });
      console.log('pageDecode dataSourcePageTabId:', dataSourcePageTabId);
      const triggerBinanceCachedRequestsFn = async () => {
        if (!isBinanceDataSourceName(dataSource)) {
          return;
        }
        try {
          const [result] = await chrome.scripting.executeScript({
            target: { tabId: dataSourcePageTabId },
            world: 'MAIN',
            func: () => {
              const replay = window.__kaitoReplayBinanceSignedRequests;
              return typeof replay === 'function' ? replay() : -1;
            },
          });
          await chrome.storage.local.set({
            kaitoBinanceReplayDebug: {
              at: Date.now(),
              tabId: dataSourcePageTabId,
              replayed: result?.result ?? null,
            },
          });
        } catch (error) {
          await chrome.storage.local.set({
            kaitoBinanceReplayDebug: {
              at: Date.now(),
              tabId: dataSourcePageTabId,
              error: error?.message || String(error),
            },
          });
        }
      };
      const hydrateBinanceCachedRequestsFn = async () => {
        if (!isBinanceDataSourceName(dataSource)) {
          return;
        }
        try {
          const [result] = await chrome.scripting.executeScript({
            target: { tabId: dataSourcePageTabId },
            world: 'MAIN',
            func: () => {
              const snapshot = window.__kaitoGetBinanceSignedRequestSnapshot;
              return typeof snapshot === 'function' ? snapshot() : [];
            },
          });
          const cachedRequests = Array.isArray(result?.result)
            ? result.result
            : [];
          const targetRequests = requests.filter((r) => r.name !== 'first');
          const existingBinanceHeaders =
            Object.values(requestsMap).find(
              (requestInfo) =>
                isBinanceTargetUrl(requestInfo?.url) &&
                requestInfo?.headers &&
                (requestInfo.headers.Cookie || requestInfo.headers.cookie)
            )?.headers ||
            Object.values(requestsMap).find(
              (requestInfo) =>
                isBinanceTargetUrl(requestInfo?.url) && requestInfo?.headers
            )?.headers ||
            {};
          let hydrated = 0;

          for (const templateRequest of targetRequests) {
            const cachedRequest = cachedRequests.find((requestInfo) => {
              if (
                templateRequest?.method &&
                requestInfo?.method &&
                String(templateRequest.method).toUpperCase() !==
                  String(requestInfo.method).toUpperCase()
              ) {
                return false;
              }
              return (
                binanceRequestMatchesTemplate(requestInfo.url, templateRequest) ||
                checkIsRequiredUrl({
                requestUrl: requestInfo.url,
                requiredUrl: templateRequest.url,
                urlType: templateRequest.urlType,
                queryParams: templateRequest.queryParams,
                })
              );
            });
            if (!cachedRequest?.url) {
              continue;
            }

            const syntheticRequestId = `kaito-binance-cache-${hydrated}-${Date.now()}`;
            storeRequestsMap(syntheticRequestId, {
              headers: {
                ...cachedRequest.headers,
                ...existingBinanceHeaders,
              },
              method: cachedRequest.method || templateRequest.method || 'GET',
              url: cachedRequest.url,
              requestId: syntheticRequestId,
              templateRequestUrl: templateRequest.url,
              type: 'xmlhttprequest',
              isTarget: 1,
              ...(cachedRequest.body !== undefined
                ? { body: cachedRequest.body }
                : {}),
            });
            hydrated += 1;
          }

          await chrome.storage.local.set({
            kaitoBinanceCacheHydrationDebug: {
              at: Date.now(),
              tabId: dataSourcePageTabId,
              cachedCount: cachedRequests.length,
              hydrated,
            },
          });
        } catch (error) {
          await chrome.storage.local.set({
            kaitoBinanceCacheHydrationDebug: {
              at: Date.now(),
              tabId: dataSourcePageTabId,
              error: error?.message || String(error),
            },
          });
        }
      };
      const injectFn = async () => {
        await chrome.scripting.executeScript({
          target: {
            tabId: dataSourcePageTabId,
          },
          files: ['pageDecode.bundle.js'],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: dataSourcePageTabId },
          files: ['static/css/pageDecode.css'],
        });
      };
      const clearDataSourcePageSessionFn = async () => {
        await chrome.scripting.executeScript({
          target: {
            tabId: dataSourcePageTabId,
          },
          func: () => {
            [
              'padoAttestRequestStatus',
              'padoAttestRequestReady',
              'padoAttestRequestErrorTxt',
              'padoAttestRequestResultStatus',
              'primusUIStep',
            ].forEach((key) => sessionStorage.removeItem(key));
            document
              .querySelectorAll('#pado-extension-content')
              .forEach((element) => element.remove());
          },
        });
      };
      const triggerExistingDataSourceRequestsFn = async () => {
        const targetRequests = requests
          .filter((r) => r.name !== 'first')
          .map((r) => ({
            url: r.url,
            method: String(r.method || 'GET').toUpperCase(),
          }))
          .filter((r) => r.url);
        if (!targetRequests.length) {
          return;
        }
        const isChatgptDataSource =
          String(activeTemplate?.dataSource || '').toLowerCase() === 'chatgpt';
	        const isBinanceDataSource =
	          isBinanceDataSourceName(activeTemplate?.dataSource) ||
	          targetRequests.some((request) => isBinanceTargetUrl(request.url));
        if (isBinanceDataSource) {
          return;
        }
        await chrome.scripting.executeScript({
          target: {
            tabId: dataSourcePageTabId,
          },
          args: [targetRequests, isChatgptDataSource],
          func: async (requestConfigs, isChatgpt) => {
            const requests = Array.isArray(requestConfigs) ? requestConfigs : [];
            const expressions = requests.map((request) => request.url).filter(Boolean);
            const normalizeLiteralUrl = (expression) => {
              let value = String(expression || '').trim();
              value = value.replace(/\(\?:\\\?\.\*\)\?\$$/, '');
              value = value.replace(/\$$/, '');
              value = value.replace(/\\\./g, '.');
              value = value.replace(/\\\//g, '/');
              if (
                /^https?:\/\//.test(value) &&
                !/[()[\]{}|+*?^$]/.test(value)
              ) {
                return value;
              }
              return '';
            };
            const matchesExpression = (url, expression) => {
              const literalUrl = normalizeLiteralUrl(expression);
              if (literalUrl) {
                return url === literalUrl || url.startsWith(`${literalUrl}?`);
              }
              try {
                return new RegExp(`^${expression}`).test(url);
              } catch {
                return url === expression || url.startsWith(`${expression}?`);
              }
            };
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const resources = performance
              .getEntriesByType('resource')
              .map((entry) => entry.name)
              .filter((url) => /^https?:\/\//.test(url));
            let urls = requests
              .map((request) => {
                const expression = request.url;
                // Prefer the actual URL the page already fetched (resource
                // timing): it carries required query params (e.g. Lighter's
                // ?by=&value=) that normalizeLiteralUrl strips off the regex,
                // leaving a bare URL the endpoint rejects. Fall back to literal.
                const matchedUrl = [...resources]
                  .reverse()
                  .find((url) => matchesExpression(url, expression));
                const url = matchedUrl || normalizeLiteralUrl(expression);
                return url
                  ? {
                      url,
                      method: String(request.method || 'GET').toUpperCase(),
                    }
                  : null;
              })
              .filter(
                (request, index, arr) =>
                  request &&
                  arr.findIndex(
                    (entry) => entry?.url === request.url && entry?.method === request.method
                  ) === index
              );

            if (isChatgpt) {
              try {
                const wantsSubscription = expressions.some((expression) =>
                  expression.includes('/backend-api/subscriptions')
                );
                const wantsUsage = expressions.some((expression) =>
                  expression.includes('/backend-api/wham/usage')
                );
                let subscriptionUrls = wantsSubscription
                  ? resources
                      .filter((url) =>
                        /\/backend-api\/subscriptions\?account_id=/.test(url)
                      )
                      .filter((url) =>
                        expressions.some((expression) =>
                          matchesExpression(url, expression)
                        )
                      )
                      .filter((url, index, arr) => arr.indexOf(url) === index)
                  : [];
                const sessionResponse = await fetch('/api/auth/session', {
                  credentials: 'include',
                  cache: 'no-store',
                });
                const session = sessionResponse.ok
                  ? await sessionResponse.json()
                  : undefined;
                const accessToken = session?.accessToken;
                if (typeof accessToken === 'string' && accessToken.length > 0) {
                  const authHeader = { authorization: `Bearer ${accessToken}` };
                  if (wantsSubscription && subscriptionUrls.length === 0) {
                    const accountsResponse = await fetch(
                      '/backend-api/accounts/check/v4-2023-04-27',
                      {
                        credentials: 'include',
                        headers: authHeader,
                        cache: 'no-store',
                      }
                    );
                    const accounts = accountsResponse.ok
                      ? await accountsResponse.json()
                      : {};
                    const accountId =
                      accounts.account_ordering?.[0] ||
                      Object.values(accounts.accounts || {})
                        .map((entry) => entry?.account?.account_id)
                        .find((id) => typeof id === 'string' && id.length > 0);
                    if (accountId) {
                      subscriptionUrls = [
                        `https://chatgpt.com/backend-api/subscriptions?account_id=${accountId}`,
                      ];
                    }
                  }
                  const chatGptTargetUrls = [
                    ...subscriptionUrls,
                    ...(wantsUsage
                      ? urls.map((request) => request.url).filter((url) =>
                          url.includes('/backend-api/wham/usage')
                        )
                      : []),
                  ].filter((url, index, arr) => url && arr.indexOf(url) === index);
                  for (const url of chatGptTargetUrls) {
                    await fetch(url, {
                      credentials: 'include',
                      headers: authHeader,
                      cache: 'no-store',
                    });
                    console.log(
                      '[kaito-attest] triggered ChatGPT target request (pageDecode bearer fast-path)',
                      url
                    );
                  }
                } else {
                  console.log(
                    '[kaito-attest] ChatGPT access token unavailable in pageDecode trigger'
                  );
                }
              } catch (error) {
                console.log(
                  '[kaito-attest] ChatGPT pageDecode trigger error',
                  error
                );
              }
              return;
            }

            for (const request of urls) {
              // Cookies first (session-scoped endpoints need them); on failure
              // retry without. Public endpoints that reply Access-Control-Allow-
              // Origin: * (e.g. Lighter) reject a credentialed cross-origin fetch,
              // so credentials:'include' fails even though the data is public.
              for (const credentials of ['include', 'omit']) {
                try {
                  const isPost = request.method === 'POST';
                  const response = await fetch(request.url, {
                    method: request.method,
                    credentials,
                    cache: 'no-store',
                    ...(isPost
                      ? {
                          headers: { 'content-type': 'application/json' },
                          body: '{}',
                        }
                      : {}),
                  });
                  if (response.ok) {
                    console.log(
                      '[kaito-attest] pageDecode triggered target request',
                      request,
                      credentials
                    );
                    break;
                  }
                } catch {}
              }
            }
          },
        });
      };

      checkWebRequestIsReadyFn();
      chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (
          tabId === dataSourcePageTabId &&
          (changeInfo.url || changeInfo.title)
        ) {
          await injectFn();
          checkWebRequestIsReadyFn();
        }
      });

      chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
        if (tabId === dataSourcePageTabId) {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            // name: 'abortAttest',
            name: 'stop',
          });
          dataSourcePageTabId = null;
          handlerForSdk(processAlgorithmReq, 'cancel');
          chrome.webRequest.onBeforeSendHeaders.removeListener(
            onBeforeSendHeadersFn
          );
          chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
          chrome.webRequest.onCompleted.removeListener(onCompletedFn);
        }
      });
      if (reloadExistingDataSourcePage) {
        await clearDataSourcePageSessionFn();
        await triggerExistingDataSourceRequestsFn();
        await injectFn();
      } else {
        await injectFn();
      }
      await triggerBinanceCachedRequestsFn();
      await hydrateBinanceCachedRequestsFn();
      await checkWebRequestIsReadyFn();
    }
    if (name === 'initCompleted') {
      console.log('content_scripts-bg-decode receive:initCompleted');
      sendResponse({
        name: 'append',
        params: {
          ...activeTemplate,
          PADOSERVERURL,
          padoExtensionVersion,
          PRE_ATTEST_PROMOT_V2,
          tabId: dataSourcePageTabId,
        },
        dataSourcePageTabId: dataSourcePageTabId,
        isReady: isReadyRequest,
        operation: operationType,
      });
      checkWebRequestIsReadyFn();
    }
    if (name === 'start') {
      await startPageDecodeAttestationFn();
      // if (!activeTemplate.sdkVersion) {
      //   const { constructorF } = DATASOURCEMAP[dataSource];
      //   if (constructorF) {
      //     const ex = new constructorF();
      //     // const storageRes = await chrome.storage.local.get([dataSource]);
      //     // const hadConnectedCurrDataSource = !!storageRes[dataSource];
      //     await storeDataSource(dataSource, ex, port, {
      //       withoutMsg: true,
      //       attestationRequestid: aligorithmParams.requestid,
      //     });
      //   }
      // }
    }

    if (name === 'close' || name === 'cancel') {
      chandleClose(params, processAlgorithmReq);
    }
    if (name === 'end') {
      handleEnd(request);
    }
    if (name === 'interceptionFail') {
      handle00013();
    }
    if (name === 'dataSourcePageDialogTimeout') {
      handleDataSourcePageDialogTimeout(processAlgorithmReq);
    }
  } else {
    if (name === 'close' || name === 'cancel') {
      chandleClose(params, processAlgorithmReq);
    }
    if (name === 'interceptionFail') {
      handle00013();
    }
    if (name === 'dataSourcePageDialogTimeout') {
      handleDataSourcePageDialogTimeout(processAlgorithmReq);
    }
    if (name === 'end') {
      handleEnd(request);
    }
  }
};

const handleEnd = (request) => {
  if (dataSourcePageTabId) {
    sendMsgToDataSourcePage(request);
    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersFn);
    chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
    chrome.webRequest.onCompleted.removeListener(onCompletedFn);
    resetVarsFn();
  }
};
const chandleClose = async (params, processAlgorithmReq) => {
  console.log('pageDecode-close');
  const deleteTabId = params?.tabId || dataSourcePageTabId;
  console.log('pageDecode-close-tabId', params?.tabId, dataSourcePageTabId);
  if (deleteTabId) {
    try {
      await chrome.tabs.remove(deleteTabId);
    } catch (e) {
      console.log('chrome.tabs.remove error:', error);
    }
  }
  console.log('pageDecode-close-currExtentionId', currExtentionId);
  try {
    if (currExtentionId) {
      await chrome.tabs.update(currExtentionId, {
        active: true,
      });
    }
  } catch (error) {
    console.log('chrome.tabs.update error:', error);
  }

  resetVarsFn();
  handlerForSdk(processAlgorithmReq, 'cancel');
};
