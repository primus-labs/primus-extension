import { customFetch2 } from '../utils/request';

let checkDataSourcePageTabId;
let devconsoleTabId;

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

  const storeDataSourceRequestsFn = async (url, urlInfo) => {
    const { dataSourceRequests: dataSourceRequestsStr } =
      await chrome.storage.local.get(['dataSourceRequests']);
    let dataSourceRequestsObj = dataSourceRequestsStr
      ? JSON.parse(dataSourceRequestsStr)
      : {};

    const lastStoreRequestObj = dataSourceRequestsObj[url] || {};
    Object.assign(dataSourceRequestsObj, {
      [url]: { ...lastStoreRequestObj, ...urlInfo },
    });
    await chrome.storage.local.set({
      dataSourceRequests: JSON.stringify(dataSourceRequestsObj),
    });
    return dataSourceRequestsObj[url];
  };

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
      console.log('444-onBeforeSendHeadersFn-details', details);
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
      // await storeDataSourceRequestsFn(formatUrlKey, { method });
      const dataSourceRequestsObj = await storeDataSourceRequestsFn(
        formatUrlKey,
        { header: formatHeader, method, locationPageUrl }
      );

      console.log('444-listen', formatUrlKey);

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
    if (
      tabId === checkDataSourcePageTabId &&
      ['xmlhttprequest', 'fetch'].includes(type) &&
      method !== 'OPTIONS'
    ) {
      console.log('444-onBeforeRequestFn-subDetails', subDetails);
      let formatUrlKey = currRequestUrl;
      if (requestBody && requestBody.raw) {
        const rawBody = requestBody.raw[0];
        if (rawBody && rawBody.bytes) {
          const byteArray = new Uint8Array(rawBody.bytes);
          const bodyText = new TextDecoder().decode(byteArray);
          // console.log(
          //   `444-url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
          // );
          await storeDataSourceRequestsFn(formatUrlKey, { body: bodyText });
        }
      }
    }
  };

  if (name === 'init') {
    devconsoleTabId = sender.tab.id;
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
  }
};
