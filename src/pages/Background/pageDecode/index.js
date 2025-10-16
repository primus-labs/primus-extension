import {
  assembleAlgorithmParams,
  assembleAlgorithmParamsForSDK,
} from '../exData';
import { storeDataSource } from '../dataSourceUtils';
import { DATASOURCEMAP } from '@/config/dataSource';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { eventReport } from '@/services/api/usertracker';
import customFetch from '../utils/request';
import {
  templateIdForMonad,
  eventListUrlForMonad,
  changeFieldsObjFnForMonad,
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
  templateIdForbBinanceEarnHistory30Days,
  startTimeDistanceForBinanceEarnHistory,
  rowForBinanceEarnHistory,
  changeFieldsObjFnForBinanceEarnHistory,
  formatRequestResponseFnForBinanceEarnHistory,
} from '../binanceEarnHistoryEvent/index.js';
import {
  templateIdForTwitch,
  formatJsonArrFnForTwitch,
  changeFieldsObjFnForTwitch,
  formatRequestResponseFnForTwitch,
} from '../twitchEvent/index.js';
import {
  lumaAccountTemplateId,
  lumaAccountTemplateReg,
  getLumaAccountTargetJumpUrl,
  getUserIdFromCookie,
} from '../scoreEvent/index.js';
import {
  isObject,
  parseCookie,
  isUrlWithQueryFn,
  checkIsRequiredUrl,
  getErrorMsgFn,
  sendMsgToTab,
} from '../utils/utils';
import {
  extraRequestFn2,
  extraRequestHtmlFn,
  errorFn,
  checkResIsMatchConditionFn,
  checkResHtmlIsMatchConditionFn,
  getNMonthsBeforeTime,
  getUTCDayLastSecondTime,
  updateUrlParams,
  parseUrlQuery,
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
  changeFieldsObjFnForMonad('reset');
  changeFieldsObjFnForTwitch('reset');
  chrome.runtime.onMessage.removeListener(listenerFn);
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
    activeTemplate = params;
    resetVarsFn();
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
      } = activeTemplate;
      const thisRequestUrlIdx = requests.findIndex(
        (r) => r.url === templateRequestUrl
      );
      const thisRequestObj = requests[thisRequestUrlIdx];
      const thisResponseObj = responses[thisRequestUrlIdx];

      const { url, urlType, queryParams, ignoreResponse } = thisRequestObj;
      const thisRequestUrlFoundFlag = Object.values(requestsMap).find(
        (v) => v.templateRequestUrl === url && v.isTarget === 1
      );

      if (!thisRequestUrlFoundFlag) {
        if (ignoreResponse) {
          Object.values(requestsMap).some((sInfo) => {
            if (sInfo.templateRequestUrl === url && sInfo.headers) {
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
            return checkRes;
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
                    return i.field;
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
                [templateIdForbBinanceEarnHistory30Days].includes(
                  activeTemplate?.attTemplateID
                )
              ) {
                const oldUrl = requestsMap[matchRequestId].url;
                const oldQueryParams = parseUrlQuery(oldUrl);
                let newStartTime = getNMonthsBeforeTime(
                  oldQueryParams.endTime,
                  startTimeDistanceForBinanceEarnHistory
                );
                const newUrlParams = {
                  pageSize: rowForBinanceEarnHistory,
                  startTime: newStartTime,
                  // asset: '',
                };

                if (additionParamsObj?.binanceBaseAsset) {
                  newUrlParams.asset = additionParamsObj?.binanceBaseAsset;
                }
                if (
                  additionParamsObj?.binanceMonthNum &&
                  typeof additionParamsObj?.binanceMonthNum === 'number'
                ) {
                  newStartTime = getNMonthsBeforeTime(
                    oldQueryParams.endTime,
                    additionParamsObj?.binanceMonthNum
                  );
                  newUrlParams.startTime = newStartTime;
                }
                if (
                  additionParamsObj?.binanceRows &&
                  additionParamsObj?.binanceRows < rowForBinanceEarnHistory
                ) {
                  newUrlParams.pageSize =
                    typeof additionParamsObj?.binanceRows === 'number'
                      ? additionParamsObj?.binanceRows
                      : Number(additionParamsObj?.rowForBinanceEarnHistory);
                }

                const newUrl = updateUrlParams(oldUrl, newUrlParams);
                targetRequestUrl = newUrl;

                const oldUrl2 = `https://www.binance.com/bapi/earn/v1/private/lending/union/redemption/list?pageIndex=1&pageSize=20&startTime=1744732800000&endTime=1760371199999&lendingType=DAILY`;
                const newUrl2 = updateUrlParams(oldUrl2, newUrlParams);
                changeFieldsObjFnForBinanceEarnHistory(
                  'add',
                  'secondUrl',
                  newUrl2
                );
                // TODO
                let matchRequestUrlResult2 = await extraRequestFn2({
                  ...requestsMap[matchRequestId],
                  header: requestsMap[matchRequestId].headers,
                  url: newUrl2,
                });

                storeRequestsMap(matchRequestId, {
                  ...requestsMap[matchRequestId],
                  url: newUrl,
                });
              }
              let matchRequestUrlResult;
              let isTargetUrl = false;
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

              if (
                matchRequestUrlResult &&
                activeTemplate?.attTemplateID === templateIdForMonad
              ) {
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
                isTargetUrl = await checkTargetRequestFnForMonad(
                  targetRequestUrl,
                  matchRequestUrlResult,
                  requestsMap[matchRequestId],
                  notMetHandler
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
                const checkRes = checkIsRequiredUrl({
                  requestUrl: rInfo.url,
                  requiredUrl: r.url,
                  urlType: r.urlType,
                  queryParams: r.queryParams,
                });
                return checkRes;
                // return matchReg(r.url, rInfo.url);
              }
            );
            if (activeRequestInfo) {
              let targetRequestId = activeRequestInfo.requestId;
              const sRrequestObj = requestsMap[targetRequestId] || {};
              // console.log('sRrequestObj', storageObj, url, sRrequestObj, r);
              chatgptHasLogin = !!sRrequestObj?.headers?.Authorization;
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
          if (sdkVersion) {
            const allRequestUrlFoundFlag = interceptorUrlArr.every((url) => {
              const curFlag = Object.values(requestsMap).find(
                (sInfo) =>
                  sInfo.templateRequestUrl === url && sInfo.isTarget === 1
              );
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

          if (fl) {
            if (dataSource === 'chatgpt') {
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
        const extraRequestSK = `https://chatgpt.com/backend-api/conversation-extra`;
        const extraSObj = await chrome.storage.local.get([extraRequestSK]);
        const extraRequestInfo = extraSObj[extraRequestSK]
          ? JSON.parse(extraSObj[extraRequestSK])
          : {};
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
          activeTemplate.attTemplateID ===
          templateIdForbBinanceEarnHistory30Days
        ) {
          const { formatRequests: req, formatResponse: res } =
            formatRequestResponseFnForBinanceEarnHistory(
              formatRequests,
              formatResponse
            );
          formatRequests = req;
          formatResponse = res;
        }
        for (const fr of formatRequests) {
          if (fr.headers) {
            fr.headers['Accept-Encoding'] = 'identity';
          }
          fr.url = fr.url.split('#')[0];
        }
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
      console.log(
        'formatAlgorithmParams',
        formatAlgorithmParams,
        form,
        activeTemplate
      );
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
        if (
          details?.initiator?.startsWith(
            `chrome-extension://${chrome.runtime.id}`
          )
        ) {
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
          chatgptHasLogin = !!formatHeader.Authorization;
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
        const isTarget = requests.some((r) => {
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
        // console.log(
        //   'captured:',
        //   currRequestUrl,
        //   'isTarget:',
        //   isTarget,
        //   details
        // );
        if (isTarget) {
          console.log('monad-details', details);
          let newCapturedInfo = {
            headers: formatHeader,
            method,
            url: currRequestUrl,
            requestId,
            templateRequestUrl,
            type: details.type, // type: "main_frame"
          };
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

        removeRequestsMap(requestId);
        let formatUrlKey = currRequestUrl;
        const isTarget = requests.some((r) => {
          if (r.name === 'first') {
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
        if (
          details?.initiator?.startsWith(
            `chrome-extension://${chrome.runtime.id}`
          )
        ) {
          return;
        }
        if (![-1, dataSourcePageTabId].includes(details.tabId)) {
          return;
        }
        let { dataSource } = activeTemplate;

        if (dataSource === 'chatgpt') {
          console.log('onCompletedFn', dataSource, details);
          // chatgpt has only one requestUrl
          // await extraRequestFn();// For simplified version comments
          console.log('setUIStep-toVerify');
          sendMsgToDataSourcePage({
            type: 'pageDecode',
            name: 'setUIStep',
            params: {
              step: 'toVerify',
            },
          });

          await formatAlgorithmParamsFn();
          console.log('RequestsHasCompleted=', RequestsHasCompleted);
          preAlgorithmFn();
          checkWebRequestIsReadyFn();
        }
      };

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

      chrome.webRequest.onCompleted.addListener(
        onCompletedFn,
        { urls: interceptorUrlArr, types: ['xmlhttprequest', 'main_frame'] },
        ['responseHeaders', 'extraHeaders']
      );

      const tabCreatedByPado = await chrome.tabs.create({
        url: jumpTo,
      });
      dataSourcePageTabId = tabCreatedByPado.id;
      console.log('pageDecode dataSourcePageTabId:', dataSourcePageTabId);
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
      await injectFn();
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
      await chrome.storage.local.set({
        beginAttest: '1',
      });
      let aligorithmParams = Object.assign(
        { isUserClick: 'true' },
        formatAlgorithmParams
      );
      await chrome.storage.local.set({
        activeRequestAttestation: JSON.stringify(aligorithmParams),
      });
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
      const {
        padoZKAttestationJSSDKBeginAttest,
        padoZKAttestationJSSDKAttestationPresetParams,
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKBeginAttest',
        'padoZKAttestationJSSDKAttestationPresetParams',
      ]);
      if (padoZKAttestationJSSDKBeginAttest) {
        const prestParamsObj = JSON.parse(
          padoZKAttestationJSSDKAttestationPresetParams
        );
        eventInfo.rawData.attestOrigin = prestParamsObj.attestOrigin;
        eventInfo.rawData.event = prestParamsObj.attestOrigin;
        eventInfo.rawData.templateId = prestParamsObj.attTemplateID;
      }
      eventReport(eventInfo);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: JSON.parse(JSON.stringify(aligorithmParams)),
      });
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
      errorFn({
        title:
          'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
        desc: 'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
        code: '00013',
      });
    }
    if (name === 'dataSourcePageDialogTimeout') {
      handleDataSourcePageDialogTimeout(processAlgorithmReq);
    }
  } else {
    if (name === 'close' || name === 'cancel') {
      chandleClose(params, processAlgorithmReq);
    }
    if (name === 'interceptionFail') {
      errorFn({
        title:
          'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
        desc: 'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
        code: '00013',
      });
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
