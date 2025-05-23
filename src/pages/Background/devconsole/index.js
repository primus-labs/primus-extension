import { customFetch2 } from '../utils/request';

let checkDataSourcePageTabId;
let checkDataSourcePageTabUrl;
let checkDataSourcePageTabUrls = [];
let devconsoleTabId;
let requestsMap = {};
let onBeforeSendHeadersFn = () => {};
let onBeforeRequestFn = () => {};
const sendMsgToDevconsole = async (msg) => {
  if (devconsoleTabId) {
    chrome.tabs.sendMessage(devconsoleTabId, msg);
  }
};
const removeRequestsMap = async (url) => {
  // console.log('requestsMap-remove', url);
  delete requestsMap[url];
};
const storeRequestsMap = async (url, urlInfo) => {
  const lastStoreRequestObj = requestsMap[url] || {};
  // console.log('requestsMap-store', url, lastStoreRequestObj, urlInfo);
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
const extraRequestFn = async (params) => {
  try {
    const { locationPageUrl, requestId, ...requestParams } = params;
    const requestRes = await customFetch2(requestParams);
    if (typeof requestRes === 'object' && requestRes !== null) {
      sendMsgToDevconsole({
        type: 'devconsole',
        name: 'checkDataSourceRes',
        params: {
          request: params,
          response: requestRes,
        },
      });
    }
  } catch (e) {
    console.log('fetch custom request error', e);
  }
};

export const devconsoleMsgListener = async (
  request,
  sender,
  sendResponse,
  password,
  port
) => {
  const { name, params } = request;

  if (name === 'init') {
    checkDataSourcePageTabId = null;
    checkDataSourcePageTabUrl = null;
    checkDataSourcePageTabUrls = [];
    devconsoleTabId = null;
    requestsMap = {};
    devconsoleTabId = sender.tab.id;
    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersFn);
    chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
    onBeforeSendHeadersFn = async (details) => {
      const {
        url: currRequestUrl,
        requestHeaders,
        method,
        type,
        tabId,
        requestId,
      } = details;
      if (
        tabId === checkDataSourcePageTabId &&
        ['xmlhttprequest', 'fetch'].includes(type) &&
        method !== 'OPTIONS'
      ) {
        // console.log('444-onBeforeSendHeadersFn-details', details);
        let formatUrlKey = currRequestUrl;
        let locationPageUrl = '';
        let formatHeader = requestHeaders.reduce((prev, curr) => {
          const { name, value } = curr;
          prev[name] = value;
          if (name === 'Referer') {
            locationPageUrl = value;
          }
          return prev;
        }, {});
        if (
          formatHeader['content-type']?.includes(
            'application/x-www-form-urlencoded'
          ) ||
          formatHeader['Content-Type']?.includes(
            'application/x-www-form-urlencoded'
          )
        ) {
          console.log('onBeforeSendHeadersFn-details', details);
        }

        const dataSourceRequestsObj = await storeRequestsMap(requestId, {
          header: formatHeader,
          headers: formatHeader,
          method,
          locationPageUrl,
          checkDataSourcePageTabUrl,
          url: currRequestUrl,
          requestId,
        });

        // console.log('444-listen', formatUrlKey);

        extraRequestFn({ ...dataSourceRequestsObj });
      }
    };
    onBeforeRequestFn = async (subDetails) => {
      const {
        url: currRequestUrl,
        requestBody,
        type,
        tabId,
        method,
        requestId,
      } = subDetails;
      await removeRequestsMap(requestId);
      if (
        tabId === checkDataSourcePageTabId &&
        ['xmlhttprequest', 'fetch'].includes(type) &&
        method !== 'OPTIONS'
      ) {
        let formatUrlKey = currRequestUrl;
        if (requestBody && requestBody.raw) {
          const rawBody = requestBody.raw[0];
          if (rawBody && rawBody.bytes) {
            const byteArray = new Uint8Array(rawBody.bytes);
            const bodyText = new TextDecoder().decode(byteArray);
            // console.log(
            //   `444-url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
            // );
            await storeRequestsMap(requestId, {
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
      { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
      ['requestHeaders', 'extraHeaders']
    );
    chrome.webRequest.onBeforeRequest.addListener(
      onBeforeRequestFn,
      { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
      ['requestBody']
    );

    const tabCreatedByPado = await chrome.tabs.create({
      url: params.expectedUrl,
      active: false,
    });
    checkDataSourcePageTabId = tabCreatedByPado.id;
    if (tabCreatedByPado.url) {
      checkDataSourcePageTabUrl = tabCreatedByPado.url;
      checkDataSourcePageTabUrls = [tabCreatedByPado.url];
      sendMsgToDevconsole({
        type: 'devconsole',
        name: 'visitedPagePaths',
        params: checkDataSourcePageTabUrls,
      });
    }
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      if (tabId === checkDataSourcePageTabId) {
        console.log('devconsole-user close data source page');
        chrome.runtime.sendMessage({
          type: 'devconsole',
          name: 'close',
        });
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
        chrome.webRequest.onBeforeSendHeaders.removeListener(
          onBeforeSendHeadersFn
        );
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
        checkDataSourcePageTabId = null;
      }
    });
    const injectFn = async () => {
      await chrome.scripting.executeScript({
        target: {
          tabId: checkDataSourcePageTabId,
        },
        files: ['catchFavicon.bundle.js'],
      });
    };
    const handleTabUpdate = async (tabId, changeInfo, tab) => {
      if (tabId === checkDataSourcePageTabId) {
        checkDataSourcePageTabUrl = tab.url;
        if (changeInfo.url && !checkDataSourcePageTabUrls.includes(tab.url)) {
          checkDataSourcePageTabUrls.push(tab.url);
          sendMsgToDevconsole({
            type: 'devconsole',
            name: 'visitedPagePaths',
            params: checkDataSourcePageTabUrls,
          });
        }
        if (changeInfo.favIconUrl) {
          sendMsgToDevconsole({
            type: 'devconsole',
            name: 'FAVICON_URL',
            params: {
              url: changeInfo.favIconUrl,
            },
          });
        }
        // console.log(
        //   'handleTabUpdate',
        //   tabId,
        //   changeInfo,
        //   tab,
        //   checkDataSourcePageTabUrl
        // );

        if (changeInfo.status === 'complete') {
          injectFn();
        }
      }
    };
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
  } else if (name === 'FAVICON_URL') {
    sendMsgToDevconsole({
      type: 'devconsole',
      name: 'FAVICON_URL',
      params,
    });
  } else if (name === 'closeDataSource') {
    console.log('debuge-zktls-closeDataSource-bg', checkDataSourcePageTabId);
    if (checkDataSourcePageTabId) {
      await chrome.tabs.remove(checkDataSourcePageTabId);
    }
  }
};
