import { assembleAlgorithmParams } from './exData';
import { storeDataSource } from './dataSourceUtils';
import { DATASOURCEMAP } from '@/config/dataSource';
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { eventReport } from '@/services/api/usertracker';

let dataSourcePageTabId;
let activeTemplate = {};
let currExtentionId;

let isReadyRequest = false;
let operationType = null;
let attestFinishFlag = false;
const handlerForSdk = async (
  processAlgorithmReq,
  operation,
  informFlag = true
) => {
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKDappTabId: dappTabId,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
  ]);
  if (padoZKAttestationJSSDKBeginAttest === '1') {
    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKWalletAddress',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'padoZKAttestationJSSDKXFollowerCount',
      'activeRequestAttestation',
    ]);
    if (processAlgorithmReq) {
      processAlgorithmReq({
        reqMethodName: 'stop',
      });
    }
    // TODO-test-yilin
    if (informFlag) {
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
        if (!attestFinishFlag) {
          chrome.tabs.sendMessage(dappTabId, {
            type: 'padoZKAttestationJSSDK',
            name: 'startAttestationRes',
            params: resParams,
          });
        } // TODO-test-yilin
      } catch (error) {
        console.log('handlerForSdk error:', error);
      }
    }
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
    activeTemplate = params;
  }
  if (activeTemplate.dataSource) {
    let {
      dataSource,
      jumpTo,
      schemaType,
      datasourceTemplate: { host, requests, responses, calculations },
      uiTemplate,
      id,
      event,
    } = activeTemplate;
    const requestUrlList = requests.map((r) => r.url);
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
    const onBeforeSendHeadersFn = async (details) => {
      const { url: currRequestUrl, requestHeaders } = details;
      let formatUrlKey = currRequestUrl;
      let addQueryStr = '';
      let needQueryDetail = false;
      const isTarget = requests.some((r) => {
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
        } else if (r.urlType === 'REGX') {
          var regex = new RegExp(r.url, 'g');
          const isTarget = currRequestUrl.match(regex);
          const result = isTarget && isTarget.length > 0;
          if (result) {
            chrome.storage.local.set({
              [r.url]: currRequestUrl,
            });
            formatUrlKey = currRequestUrl;
          }
          return result;
        } else {
          return r.url === currRequestUrl;
        }
      });
      if (isTarget) {
        let formatHeader = requestHeaders.reduce((prev, curr) => {
          const { name, value } = curr;
          prev[name] = value;
          return prev;
        }, {});
        // const requestHeadersObj = JSON.stringify(formatHeader);
        const storageObj = await chrome.storage.local.get([formatUrlKey]);
        const currRequestUrlStorage = storageObj[formatUrlKey];
        const currRequestObj = currRequestUrlStorage
          ? JSON.parse(currRequestUrlStorage)
          : {};
        const newCurrRequestObj = {
          ...currRequestObj,
          headers: formatHeader,
        };
        if (addQueryStr) {
          newCurrRequestObj.queryString = addQueryStr;
        }
        // console.log('222222listen', formatUrlKey);
        await chrome.storage.local.set({
          [formatUrlKey]: JSON.stringify(newCurrRequestObj),
        });
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
    const onBeforeRequestFn = async (subDetails) => {
      const { url: currRequestUrl, requestBody } = subDetails;
      let formatUrlKey = currRequestUrl;
      const isTarget = requests.some((r) => {
        if (r.queryParams && r.queryParams[0]) {
          const urlStrArr = currRequestUrl.split('?');
          const hostUrl = urlStrArr[0];
          let curUrlWithQuery = r.url === hostUrl;
          if (r.url === hostUrl) {
            curUrlWithQuery = isUrlWithQueryFn(currRequestUrl, r.queryParams);
          }
          formatUrlKey = hostUrl;
          return curUrlWithQuery;
        } else if (r.urlType === 'REGX') {
          var regex = new RegExp(r.url, 'g');
          const isTarget = currRequestUrl.match(regex);
          const result = isTarget && isTarget.length > 0;
          if (result) {
            chrome.storage.local.set({
              [r.url]: currRequestUrl,
            });
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

            const storageObj = await chrome.storage.local.get([formatUrlKey]);
            const currRequestUrlStorage = storageObj[formatUrlKey];
            const currRequestObj = currRequestUrlStorage
              ? JSON.parse(currRequestUrlStorage)
              : {};
            const newCurrRequestObj = {
              ...currRequestObj,
              body: JSON.parse(bodyText),
            };
            await chrome.storage.local.set({
              [formatUrlKey]: JSON.stringify(newCurrRequestObj),
            });
          }
        }
      }
    };
    const checkWebRequestIsReadyFn = async () => {
      const checkReadyStatusFn = async () => {
        const interceptorRequests = requests.filter((r) => r.name !== 'first');
        const interceptorUrlArr = interceptorRequests.map((i) => i.url);
        console.log('555-newsttestations-interceptorUrlArr', interceptorUrlArr);
        const storageObj = await chrome.storage.local.get(interceptorUrlArr);
        const storageArr = Object.values(storageObj);
        if (storageArr.length === interceptorUrlArr.length) {
          const f = interceptorRequests.every(async (r) => {
            // const storageR = Object.keys(storageObj).find(
            //   (sRKey) => sRKey === r.url
            // );
            let url = r.url;
            if (r.urlType === 'REGX') {
              const realUrl = await chrome.storage.local.get(r.url);
              url = realUrl[r.url];
            }
            const sRrequestObj = storageObj[url]
              ? JSON.parse(storageObj[url])
              : {};
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
          return f;
        } else {
          return false;
        }
      };
      isReadyRequest = await checkReadyStatusFn();
      if (isReadyRequest) {
        console.log('web requests are captured', requests);
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
      const aaa = await chrome.storage.local.get(interceptorUrlArr);
      await chrome.storage.local.remove(interceptorUrlArr);
      const bbb = await chrome.storage.local.get(interceptorUrlArr);
      console.log('debugSDK-remove-lastRequestInfos', interceptorUrlArr, aaa, bbb);
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
      const tabCreatedByPado = await chrome.tabs.create({
        url: jumpTo,
      });
      dataSourcePageTabId = tabCreatedByPado.id;
      // console.log('create dataSourcePageTabId', dataSourcePageTabId);
      console.log(
        'debugSDK-3-2-bg-pageDecode-init',
        new Date().toLocaleString(),
        'dataSourcePageTabId:',
        dataSourcePageTabId,
        'activeTemplate:',
        JSON.stringify(activeTemplate),
        'interceptorUrlArr:',
        JSON.stringify(interceptorUrlArr),
        'before:',
        aaa,
        'after:',
        bbb
      );
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
      await injectFn();
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
          await chrome.runtime.sendMessage({
            type: 'pageDecode',
            // name: 'abortAttest',
            name: 'stop',
          });
          dataSourcePageTabId = null;
          handlerForSdk(processAlgorithmReq, 'cancel');
        }
      });
      // injectFn();
    }
    if (name === 'initCompleted') {
      // console.log('content_scripts-bg-decode receive:initCompleted');
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
    }
    if (name === 'start') {
      await chrome.storage.local.set({
        beginAttest: '1',
      });
      /*const dataSourceCookies = await chrome.cookies.getAll({
      url: new URL(jumpTo).origin,
    });
    const cookiesObj = dataSourceCookies.reduce((prev, curr) => {
      const { name, value } = curr;
      prev[name] = value;
      return prev;
    }, {});*/

      const { category, requestid } = activeTemplate;
      console.log(
        'debugSDK-3-3-bg-pageDecode-start',
        new Date().toLocaleString(),
        requestid
      );
      const form = {
        source: dataSource,
        type: category,
        label: null,
        exUserId: null,
        requestid,
      };
      // console.log(WorkerGlobalScope.location)
      if (event) {
        form.event = event;
      }
      // "X Followers" required update baseValue
      // console.log('222activeTemplate', activeTemplate);
      if (activeTemplate.id === '15') {
        form.baseValue =
          activeTemplate.datasourceTemplate.responses[1].conditions.subconditions[1].value;
      }
      if (activeTemplate.requestid) {
        form.requestid = activeTemplate.requestid;
      }
      let aligorithmParams = await assembleAlgorithmParams(form, password);
      const formatRequests = [];
      for (const r of requests) {
        if (r.queryDetail) {
          continue;
        }
        let { headers, cookies, body, url, urlType } = r;
        let formatUrlKey = url;
        if (urlType === 'REGX') {
          formatUrlKey = await chrome.storage.local.get(url);
          formatUrlKey = formatUrlKey[url];
          url = formatUrlKey;
          r.url = url;
        }
        const requestInfoObj = await chrome.storage.local.get([formatUrlKey]);
        console.log(
          'debugSDK-captured-requestInfoObj',
          formatUrlKey, requestInfoObj
        );
        const {
          headers: curRequestHeader,
          body: curRequestBody,
          queryString,
        } = (requestInfoObj[url] && JSON.parse(requestInfoObj[url])) || {};

        const cookiesObj = curRequestHeader
          ? parseCookie(curRequestHeader.Cookie)
          : {};
        let formateHeader = {},
          formateCookie = {},
          formateBody = {};
        if (headers && headers.length > 0) {
          headers.forEach((hk) => {
            if (curRequestHeader) {
              const inDataSourceHeaderKey = Object.keys(curRequestHeader).find(
                (h) => h.toLowerCase() === hk.toLowerCase()
              );
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

        formatRequests.push(r);
      }
      const activeInfo = formatRequests.find((i) => i.headers);
      const activeHeader = Object.assign({}, activeInfo.headers);
      const authInfoName = dataSource + '-auth';
      await chrome.storage.local.set({
        [authInfoName]: JSON.stringify(activeHeader),
      });

      if (dataSource === 'binance') {
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
        responses,
        uiTemplate,
        templateId: id,
        calculations,
      });
      if (schemaType.startsWith('OKX_TOKEN_HOLDING')) {
        aligorithmParams.requests[2].url =
          aligorithmParams.requests[2].url.replace('limit=5', 'limit=100');
      }
      await chrome.storage.local.set({
        activeRequestAttestation: JSON.stringify(aligorithmParams),
      });
      console.log('222222pageDecode-aligorithmParams', aligorithmParams);

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
      if (padoZKAttestationJSSDKBeginAttest === '1') {
        eventInfo.rawData.attestOrigin =
          padoZKAttestationJSSDKAttestationPresetParams
            ? JSON.parse(padoZKAttestationJSSDKAttestationPresetParams)
                .attestOrigin
            : '';
      }
      eventReport(eventInfo);
      console.log(
        'debugSDK-3-4-bg-pageDecode-getAttestation',
        new Date().toLocaleString(),
        'aligorithmParams:',
        JSON.stringify(aligorithmParams),
        'formatRequests:',
        JSON.stringify(formatRequests)
      );
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: {
          ...aligorithmParams,
          PADOSERVERURL,
          padoExtensionVersion,
          requestid: aligorithmParams.requestid,
        },
      });

      const { constructorF } = DATASOURCEMAP[dataSource];
      const ex = new constructorF();

      // const storageRes = await chrome.storage.local.get([dataSource]);
      // const hadConnectedCurrDataSource = !!storageRes[dataSource];
      await storeDataSource(dataSource, ex, port, {
        withoutMsg: true,
      });
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
      handlerForSdk(processAlgorithmReq, 'cancel');
    }
    if (name === 'end') {
      if (dataSourcePageTabId) {
        await chrome.tabs.sendMessage(
          dataSourcePageTabId,
          request,
          function (response) {}
        );
        chrome.webRequest.onBeforeSendHeaders.removeListener(
          onBeforeSendHeadersFn
        );
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
        // handlerForSdk(undefined, undefined, false);
        //TODO-test-yilin
        attestFinishFlag = true;
        await chrome.tabs.remove(dataSourcePageTabId); //TODO-test-yilin
      }
    }
  } else {
    if (name === 'end') {
      if (dataSourcePageTabId) {
        await chrome.tabs.sendMessage(
          dataSourcePageTabId,
          request,
          function (response) {}
        );
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
