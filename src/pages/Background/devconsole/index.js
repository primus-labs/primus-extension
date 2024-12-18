import { customFetch2 } from '../utils/request';

let checkDataSourcePageTabId;
let devconsoleTabId;
let requestsMap = {};
const removeRequestsMap = async (url) => {
  // console.log('requestsMap-remove', url);
  delete requestsMap[url];
};
const storeRequestsMap = async (url, urlInfo) => {
  const lastStoreRequestObj = requestsMap[url] || {};
  // console.log('requestsMap-store', url, lastStoreRequestObj, urlInfo);
  Object.assign(requestsMap, {
    [url]: { ...lastStoreRequestObj, ...urlInfo },
  });
  return requestsMap[url];
};
const extraRequestFn = async (params) => {
  try {
    const { locationPageUrl, ...requestParams } = params;
    const requestRes = await customFetch2(requestParams);
    if (typeof requestRes === 'object' && requestRes !== null) {
      chrome.tabs.sendMessage(devconsoleTabId, {
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

  const onBeforeSendHeadersFn = async (details) => {
    const {
      url: currRequestUrl,
      requestHeaders,
      method,
      type,
      tabId,
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
        // debugger;
      }

      const dataSourceRequestsObj = await storeRequestsMap(formatUrlKey, {
        header: formatHeader,
        method,
        locationPageUrl,
      });

      // console.log('444-listen', formatUrlKey);

      extraRequestFn({ ...dataSourceRequestsObj, url: currRequestUrl });
    }
  };
  const onBeforeRequestFn = async (subDetails) => {
    const {
      url: currRequestUrl,
      requestBody,
      type,
      tabId,
      method,
    } = subDetails;
    await removeRequestsMap(currRequestUrl);
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
          await storeRequestsMap(formatUrlKey, { body: JSON.parse(bodyText) });
        }
      }
      if (requestBody && requestBody.formData) {
        await storeRequestsMap(formatUrlKey, {
          body: requestBody.formData,
          isFormData: true,
        });
      }
    }
  };

  if (name === 'init') {
    checkDataSourcePageTabId = null;
    devconsoleTabId = null;
    requestsMap = {};
    devconsoleTabId = sender.tab.id;
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
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      if (tabId === checkDataSourcePageTabId) {
        console.log('devconsole-user close data source page');
        chrome.runtime.sendMessage({
          type: 'devconsole',
          name: 'close',
        });
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
      if (
        tabId === checkDataSourcePageTabId &&
        changeInfo.status === 'complete'
      ) {
        injectFn();
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      }
    };
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
  } else if (name === 'FAVICON_URL') {
    chrome.tabs.sendMessage(devconsoleTabId, {
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
