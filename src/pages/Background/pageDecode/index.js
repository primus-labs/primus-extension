import { assembleAlgorithmParamsForSDK } from '../exData';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { eventReport } from '@/services/api/usertracker';
import {
  isObject,
  isUrlWithQueryFn,
  checkIsRequiredUrl,
  sendMsgToTab,
} from '../utils/utils';
import { addSDKParamsToReportParamsFn } from '../utils/reportEvent.js';
import {
  extraRequestFn2,
  extraRequestHtmlFn,
  errorFn,
  checkResIsMatchConditionFn,
  checkResHtmlIsMatchConditionFn,
} from './utils';

const CLIENTTYPE = '@primuslabs/extension';

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
let formatAlgorithmParams = null;
let onBeforeSendHeadersFn = () => {};
let onBeforeRequestFn = () => {};
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
  formatAlgorithmParams = null;
  requestsMap = {};
  reportRequestIds = [];
};
const handlerForSdk = async (processAlgorithmReq, operation) => {
  const {
    padoZKAttestationJSSDKBeginAttest,
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

const eventReportGenerateFn = async (rawData) => {
  var eventInfo = {
    eventType: 'ATTESTATION_GENERATE',
    rawData,
  };
  eventReport(eventInfo);
};
const handle00013 = async (options = {}) => {
  errorFn(
    {
      title:
        'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
      desc: 'Target data missing. Please check that the JSON path of the data in the response from the request URL matches your template.',
      code: '00013',
    },
    undefined,
    options
  );
};

const handleDataSourcePageDialogTimeout = async (processAlgorithmReq) => {
  var eventInfo = {
    eventType: 'ATTESTATION_GENERATE',
    rawData: {
      status: "FAILED",
      detail: {
        code: '00014',
        desc: ""
      },
    }
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
      Object.assign(rawData, {
        ext: {
          ...rawData.ext,
          getAttestationResultRes: getAttestationResultRes
        }
      });
    }

    if (!getAttestationResultRes) {
      eventReportGenerateFn(rawData)
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

        const { 
          dataSourceId,
          attTemplateID,
          ext: {
            appSignParameters 
          }, 
          clientType} = parsedActiveRequestAttestation
        
        Object.assign(eventInfo.rawData, {
          source: dataSourceId,
          clientType,
          appId: "",
          templateId: attTemplateID,
          address: JSON.parse(appSignParameters)?.userAddress,
          ext: {
          }
        });
        eventReportFn(eventInfo.rawData)
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

        const {source,schemaType,sigFormat,user,event} = parsedActiveRequestAttestation
        Object.assign(eventInfo.rawData, {
          source,
          clientType: CLIENTTYPE,
          appId: "",
          templateId: schemaType,
          address: user?.address,
          ext: {
            sigFormat,
            event
          }
        });
        await eventReportFn(eventInfo.rawData);
        await chrome.storage.local.remove(['activeRequestAttestation'])
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
  port,
  hasGetTwitterScreenName,
  processAlgorithmReq
) => {
  const { name, params } = request;
  console.log('pageDecodeMsgListener');
  if (name === 'init') {
    activeTemplate = {};
    activeTemplate = params;
    resetVarsFn();
  }
  if (activeTemplate.dataSource) {
    let {
      jumpTo,
      datasourceTemplate: { requests },
    } = activeTemplate;

    const checkSDKTargetRequestFn = async (requestId, templateRequestUrl) => {
      const {
        datasourceTemplate: { requests, responses },
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
                    return isObject(i.field) && i.field?.field
                      ? i.field.field
                      : i.field;
                  }
                }
              );
              let targetRequestUrl = requestsMap[matchRequestId].url;

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

              isTargetUrl = checkResIsMatchConditionFn(
                jsonPathArr,
                matchRequestUrlResult
              );

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
          datasourceTemplate: { requests },
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
              }
            );
            if (activeRequestInfo) {
              const sRrequestObj =
                requestsMap[activeRequestInfo.requestId] || {};
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
          const allRequestUrlFoundFlag = interceptorUrlArr.every((url) => {
            const curFlag = Object.values(requestsMap).find(
              (sInfo) =>
                sInfo.templateRequestUrl === url && sInfo.isTarget === 1
            );
            return !!curFlag;
          });

          fl = f && !!allRequestUrlFoundFlag;

          if (fl && !formatAlgorithmParams) {
            await formatAlgorithmParamsFn();
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
      
      if (activeTemplate.requestid) {
        form.requestid = activeTemplate.requestid;
      }
      let aligorithmParams = await assembleAlgorithmParamsForSDK(
        {
          dataSource: activeTemplate.dataSource,
          algorithmType: activeTemplate.algorithmType,
          requestid: activeTemplate.requestid,
          sslCipherSuite: activeTemplate.sslCipherSuite,
          allJsonResponseFlag: activeTemplate.allJsonResponseFlag,
        },
        activeTemplate.ext
      );

      let formatRequests = [];
      for (const r of JSON.parse(JSON.stringify(requests))) {
        if (r.queryDetail) {
          continue;
        }

        let targetRequestId =
          Object.values(requestsMap).find(
            (sInfo) =>
              sInfo.templateRequestUrl === r.url && sInfo.isTarget === 1
          )?.requestId || '';

        const currRequestInfoObj = requestsMap[targetRequestId] || {};
        const {
          headers: curRequestHeader,
          body: curRequestBody,
          queryString,
          url,
        } = currRequestInfoObj;

        Object.assign(r, {
          headers: { ...curRequestHeader },
          body: isObject(curRequestBody)
            ? { ...curRequestBody }
            : curRequestBody,
          url: queryString ? r.url + '?' + queryString : r.url,
        });
        formatRequests.push({ ...r, url: r.name === 'first' ? r.url : url });
      }
      const formatResponse = JSON.parse(JSON.stringify(responses));
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
      console.log(
        'formatAlgorithmParams',
        formatAlgorithmParams,
        form,
        activeTemplate
      );
    };

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
      await chrome.storage.local.remove(interceptorUrlArr);
      console.log('lastStorage-remove', interceptorUrlArr);

      chrome.webRequest.onBeforeSendHeaders.removeListener(
        onBeforeSendHeadersFn
      );
      chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
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
          jumpTo,
          datasourceTemplate: { requests },
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
        let templateRequestUrl = '';

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
          await checkSDKTargetRequestFn(requestId, templateRequestUrl);
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
      chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
        if (
          tabId === dataSourcePageTabId &&
          (changeInfo.url || changeInfo.title)
        ) {
          await injectFn();
          checkWebRequestIsReadyFn();
        }
      });

      chrome.tabs.onRemoved.addListener(async (tabId, _removeInfo) => {
        if (tabId === dataSourcePageTabId) {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'stop',
          });
          dataSourcePageTabId = null;
          handlerForSdk(processAlgorithmReq, 'cancel');
          chrome.webRequest.onBeforeSendHeaders.removeListener(
            onBeforeSendHeadersFn
          );
          chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
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
      eventInfo.rawData = await addSDKParamsToReportParamsFn(eventInfo.rawData);
      eventReport(eventInfo);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: JSON.parse(JSON.stringify(aligorithmParams)),
      });
    }

    if (name === 'close' || name === 'cancel') {
      chandleClose(params, processAlgorithmReq);
    }
    if (name === 'end') {
      handleEnd(request);
    }
    if (name === 'interceptionFail') {
      const { padoZKAttestationJSSDKBeginAttest } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
      handle00013(
        padoZKAttestationJSSDKBeginAttest
          ? {}
          : { skipRemoveActiveRequestAttestation: true }
      );
    }
    if (name === 'dataSourcePageDialogTimeout') {
      handleDataSourcePageDialogTimeout(processAlgorithmReq);
    }
  } else {
    if (name === 'close' || name === 'cancel') {
      chandleClose(params, processAlgorithmReq);
    }
    if (name === 'interceptionFail') {
      const { padoZKAttestationJSSDKBeginAttest } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
        debugger
      handle00013(
        padoZKAttestationJSSDKBeginAttest
          ? {}
          : { skipRemoveActiveRequestAttestation: true }
      );
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
