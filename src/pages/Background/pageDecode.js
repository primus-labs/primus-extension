import {
  assembleAlgorithmParams,
  assembleAlgorithmParamsForSDK,
} from './exData';
import { storeDataSource } from './dataSourceUtils';
import { DATASOURCEMAP } from '@/config/dataSource';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { eventReport } from '@/services/api/usertracker';
import customFetch from './utils/request';
import { isJSONString } from './utils/utils';
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

const removeRequestsMap = async (url) => {
  // console.log('requestsMap-remove', url);
  // console.log('x-remove');
  // await chrome.storage.local.remove([
  //   'https://www.tiktok.com/passport/web/account/info/',
  //   'https://api.x.com/1.1/account/settings.json',
  // ]);
  delete requestsMap[url];
};
const storeRequestsMap = (url, urlInfo) => {
  const lastStoreRequestObj = requestsMap[url] || {};
  // console.log('requestsMap-store', url, lastStoreRequestObj, urlInfo);
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
      chrome.tabs.sendMessage(dappTabId, {
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
  try {
    const requestRes = await customFetch(fullRequestUrl, {
      method: 'GET',
      // headers: JSON.parse(storageRes[requestUrl]).headers,
      headers: storageRes[requestUrl].headers,
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
    const isUrlWithQueryFn = (url, queryKeyArr) => {
      const urlStrArr = url.split('?');
      const queryStr = urlStrArr[1];
      const queryStrArr = queryStr.split('&');
      const isUrlWithQuery = queryKeyArr.every((tQItem) => {
        return queryStrArr.some((qItem) => {
          return qItem.split('=')[0] === tQItem;
        });
      });
      return isUrlWithQuery ? queryStr : false;
    };
    onBeforeSendHeadersFn = async (details) => {
      let {
        dataSource,
        jumpTo,
        datasourceTemplate: { requests },
      } = activeTemplate;
      const { url: currRequestUrl, requestHeaders, method } = details;
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
          chrome.tabs.sendMessage(
            dataSourcePageTabId,
            {
              type: 'pageDecode',
              name: 'setUIStep',
              params: {
                step: tipStr,
              },
            },
            function (response) {}
          );
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
          return !!curUrlWithQuery;
        } else if (r.urlType === 'REGX' && r.url !== currRequestUrl) {
          var regex = new RegExp(r.url, 'g');
          const isTarget = currRequestUrl.match(regex);
          const result = isTarget && isTarget.length > 0;
          if (result) {
            chrome.storage.local.set({
              [r.url]: currRequestUrl,
            });
            console.log('lastStorage-set-url', r.url, currRequestUrl);
            formatUrlKey = currRequestUrl;
          }
          return result;
        } else {
          return r.url === currRequestUrl;
        }
      });
      if (isTarget) {
        let newCapturedInfo = {
          headers: formatHeader,
          method,
        };
        if (addQueryStr) {
          newCapturedInfo.queryString = addQueryStr;
        }
        const newCurrRequestObj = storeRequestsMap(
          formatUrlKey,
          newCapturedInfo
        );
        const requireUrlArr = [
          'https://www.tiktok.com/passport/web/account/info/',
          'https://api.x.com/1.1/account/settings.json',
        ];
        const curRequireUrl = requireUrlArr.find((i) =>
          currRequestUrl.includes(i)
        );
        if (curRequireUrl) {
          await chrome.storage.local.set({
            [curRequireUrl]: JSON.stringify(newCurrRequestObj),
          });
        }
        // const requestHeadersObj = JSON.stringify(formatHeader);
        // const storageObj = await chrome.storage.local.get([formatUrlKey]);
        // const currRequestUrlStorage = storageObj[formatUrlKey];
        // const currRequestObj = currRequestUrlStorage
        //   ? JSON.parse(currRequestUrlStorage)
        //   : {};
        // const newCurrRequestObj = {
        //   ...currRequestObj,
        //   headers: formatHeader,
        // };
        // if (addQueryStr) {
        //   newCurrRequestObj.queryString = addQueryStr;
        // }
        // // console.log('222222listen', formatUrlKey);
        // await chrome.storage.local.set({
        //   [formatUrlKey]: JSON.stringify(newCurrRequestObj),
        // });
        // console.log('lastStorage-set', formatUrlKey, newCurrRequestObj);
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
        checkWebRequestIsReadyFn();
      }
    };
    onBeforeRequestFn = async (subDetails) => {
      let {
        datasourceTemplate: { requests },
      } = activeTemplate;
      const { url: currRequestUrl, requestBody } = subDetails;
      removeRequestsMap(currRequestUrl);
      let formatUrlKey = currRequestUrl;
      const isTarget = requests.some((r) => {
        if (r.name === 'first') {
          return false;
        }
        if (r.queryParams && r.queryParams[0]) {
          const urlStrArr = currRequestUrl.split('?');
          const hostUrl = urlStrArr[0];
          let curUrlWithQuery = r.url === hostUrl;
          if (r.url === hostUrl) {
            curUrlWithQuery = isUrlWithQueryFn(currRequestUrl, r.queryParams);
          }
          formatUrlKey = hostUrl;
          return curUrlWithQuery;
        } else if (r.urlType === 'REGX' && r.url !== currRequestUrl) {
          var regex = new RegExp(r.url, 'g');
          const isTarget = currRequestUrl.match(regex);
          const result = isTarget && isTarget.length > 0;
          if (result) {
            chrome.storage.local.set({
              [r.url]: currRequestUrl,
            });
            console.log('lastStorage-set', r.url, currRequestUrl);
          }
          return result;
        } else {
          return r.url === currRequestUrl;
        }
      });
      if (isTarget) {
        if (requestBody && requestBody.raw) {
          const rawBody = requestBody.raw[0];
          if (rawBody && rawBody.bytes) {
            const byteArray = new Uint8Array(rawBody.bytes);
            const bodyText = new TextDecoder().decode(byteArray);
            console.log(
              `url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
            );

            storeRequestsMap(formatUrlKey, { body: JSON.parse(bodyText) });

            // const storageObj = await chrome.storage.local.get([formatUrlKey]);
            // const currRequestUrlStorage = storageObj[formatUrlKey];
            // const currRequestObj = currRequestUrlStorage
            //   ? JSON.parse(currRequestUrlStorage)
            //   : {};
            // const newCurrRequestObj = {
            //   ...currRequestObj,
            //   body: JSON.parse(bodyText),
            // };
            // await chrome.storage.local.set({
            //   [formatUrlKey]: JSON.stringify(newCurrRequestObj),
            // });
            // console.log('lastStorage-set', formatUrlKey, newCurrRequestObj);
          }
        }
      }
    };
    onCompletedFn = async (details) => {
      let { dataSource } = activeTemplate;

      if (dataSource === 'chatgpt') {
        console.log('onCompletedFn', dataSource, details);
        // chatgpt has only one requestUrl
        await extraRequestFn();
        console.log('setUIStep-toVerify');
        chrome.tabs.sendMessage(
          dataSourcePageTabId,
          {
            type: 'pageDecode',
            name: 'setUIStep',
            params: {
              step: 'toVerify',
            },
          },
          function (response) {}
        );
        await formatAlgorithmParamsFn();
        console.log('RequestsHasCompleted=', RequestsHasCompleted);
        preAlgorithmFn();
        checkWebRequestIsReadyFn();
      }
    };
    const checkWebRequestIsReadyFn = async () => {
      const checkReadyStatusFn = async () => {
        let {
          dataSource,
          datasourceTemplate: { requests },
        } = activeTemplate;

        const interceptorRequests = requests.filter((r) => r.name !== 'first');
        const interceptorUrlArr = interceptorRequests.map((i) => i.url);
        // console.log('555-newsttestations-interceptorUrlArr', interceptorUrlArr);
        // const storageObj = await chrome.storage.local.get(interceptorUrlArr);
        // const storageArr = Object.values(storageObj);
        const storageObj = requestsMap;
        const storageArr = Object.values(storageObj);

        if (
          interceptorUrlArr.length > 0 &&
          storageArr.length >= interceptorUrlArr.length
        ) {
          const f = interceptorRequests.every(async (r) => {
            let url = r.url;
            if (r.urlType === 'REGX') {
              const storageObj = await chrome.storage.local.get(r.url);
              if (storageObj[r.url] && !isJSONString(storageObj[r.url])) {
                url = storageObj[r.url];
              }
            }

            const sRrequestObj = storageObj[url] || {};
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

            return headersFlag && bodyFlag && cookieFlag;
          });

          const fl =
            dataSource === 'chatgpt'
              ? !!f &&
                chatgptHasLogin &&
                RequestsHasCompleted &&
                preAlgorithmStatus === '1'
              : f;

          if (fl) {
            if (dataSource === 'chatgpt') {
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
        console.log(
          'all web requests are captured',
          isReadyRequest,
          dataSourcePageTabId
        );
        chrome.tabs.sendMessage(
          dataSourcePageTabId,
          {
            type: 'pageDecode',
            name: 'webRequestIsReady',
            params: {
              isReady: isReadyRequest,
            },
          },
          function (response) {}
        );
      }
    };

    const formatAlgorithmParamsFn = async () => {
      let {
        dataSource,
        schemaType,
        datasourceTemplate: { host, requests, responses, calculations },
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

      const formatRequests = [];
      for (const r of JSON.parse(JSON.stringify(requests))) {
        if (r.queryDetail) {
          continue;
        }
        let { headers, cookies, body, url, urlType } = r;
        let formatUrlKey = url;
        if (urlType === 'REGX') {
          const storageObj = await chrome.storage.local.get(url);
          if (storageObj[url] && !isJSONString(storageObj[url])) {
            console.log('formatAlgorithmParamsFn-regx-storageObj', storageObj);
            formatUrlKey = storageObj[url];
            url = formatUrlKey;
            r.url = url;
          }
        }
        const currRequestInfoObj = requestsMap[formatUrlKey] || {};

        // console.log(
        //   'lastStorage-get-formatAlgorithmParamsFn',
        //   'formatUrlKey:',
        //   formatUrlKey,
        //   'currRequestInfoObj:',
        //   JSON.stringify(currRequestInfoObj),
        //   JSON.stringify(requestsMap)
        // );
        const {
          headers: curRequestHeader,
          body: curRequestBody,
          queryString,
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
            body: { ...curRequestBody },
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
        formatRequests.push(r);
      }
      const activeInfo = formatRequests.find((i) => i.headers);
      const activeHeader = Object.assign({}, activeInfo?.headers);
      const authInfoName = dataSource + '-auth';
      await chrome.storage.local.set({
        [authInfoName]: JSON.stringify(activeHeader),
      });
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
        for (const fr of formatRequests) {
          if (fr.headers) {
            fr.headers['Accept-Encoding'] = 'identity';
          }
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
        const errorFn = async () => {
          let resParams = {
            result: false,
            errorData: {
              title: 'Launch failed: unstable connection.',
              desc: 'Launch failed: unstable connection.',
              code: '00011',
            },
          };
          const { padoZKAttestationJSSDKDappTabId: dappTabId } =
            await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
          chrome.tabs.sendMessage(dappTabId, {
            type: 'padoZKAttestationJSSDK',
            name: 'getAttestationRes',
            params: resParams,
          });
          const attestationType = formatAlgorithmParams?.attestationType;
          const errorMsgTitle = [
            'Assets Verification',
            'Humanity Verification',
          ].includes(attestationType)
            ? `${attestationType} failed!`
            : `${attestationType} proof failed!`;

          msgObj = {
            type: 'error',
            title: errorMsgTitle,
            desc: 'The algorithm has not been initialized.Please try again later.',
            sourcePageTip: errorMsgTitle,
          };
          await chrome.storage.local.remove([
            'padoZKAttestationJSSDKBeginAttest',
            'padoZKAttestationJSSDKWalletAddress',
            'padoZKAttestationJSSDKAttestationPresetParams',
            'padoZKAttestationJSSDKXFollowerCount',
            'activeRequestAttestation',
          ]);
          if (dataSourcePageTabId) {
            await chrome.tabs.remove(dataSourcePageTabId);
          }
        };
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
                  errorFn();
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
                  errorFn();
                }
              }
            }
          }
        }
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);

    if (name === 'init') {
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
        onBeforeSendHeadersFn,
        { urls: ['<all_urls>'] },
        ['requestHeaders', 'extraHeaders']
      );
      chrome.webRequest.onBeforeRequest.removeListener(
        onBeforeRequestFn,
        { urls: ['<all_urls>'] },
        ['requestBody']
      );

      chrome.webRequest.onCompleted.removeListener(
        onCompletedFn,
        { urls: interceptorUrlArr },
        ['responseHeaders', 'extraHeaders']
      );

      chrome.webRequest.onBeforeSendHeaders.addListener(
        onBeforeSendHeadersFn,
        { urls: ['<all_urls>'] },
        ['requestHeaders', 'extraHeaders']
      );
      chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequestFn,
        { urls: ['<all_urls>'] },
        ['requestBody']
      );

      chrome.webRequest.onCompleted.addListener(
        onCompletedFn,
        { urls: interceptorUrlArr },
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
        const formatOrigin =
          padoZKAttestationJSSDKBeginAttest === '1'
            ? prestParamsObj.attestOrigin
            : prestParamsObj.appId;
        eventInfo.rawData.attestOrigin = formatOrigin;
      }
      eventReport(eventInfo);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: JSON.parse(JSON.stringify(aligorithmParams)),
      });
      if (!activeTemplate.sdkVersion) {
        const { constructorF } = DATASOURCEMAP[dataSource];
        if (constructorF) {
          const ex = new constructorF();
          // const storageRes = await chrome.storage.local.get([dataSource]);
          // const hadConnectedCurrDataSource = !!storageRes[dataSource];
          await storeDataSource(dataSource, ex, port, {
            withoutMsg: true,
            attestationRequestid: aligorithmParams.requestid,
          });
        }
      }
    }

    if (name === 'close' || name === 'cancel') {
      try {
        await chrome.tabs.update(currExtentionId, {
          active: true,
        });
      } catch (error) {
        console.log('cancel error:', error);
      }
      if (dataSourcePageTabId) {
        await chrome.tabs.remove(dataSourcePageTabId);
      }
      resetVarsFn();
      handlerForSdk(processAlgorithmReq, 'cancel');
    }
    if (name === 'end') {
      if (dataSourcePageTabId) {
        chrome.tabs.sendMessage(
          dataSourcePageTabId,
          request,
          function (response) {}
        );
        chrome.webRequest.onBeforeSendHeaders.removeListener(
          onBeforeSendHeadersFn
        );
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
        resetVarsFn();
      }
    }
  } else {
    if (name === 'end') {
      if (dataSourcePageTabId) {
        chrome.tabs.sendMessage(
          dataSourcePageTabId,
          request,
          function (response) {}
        );
        resetVarsFn();
      }
    }
  }
};

const parseCookie = (str) => {
  str = str || '';
  return str
    .split(';')
    .map((v) => v.split('='))
    .reduce((acc, v) => {
      if (v[0] && v[1]) {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      }

      return acc;
    }, {});
};
