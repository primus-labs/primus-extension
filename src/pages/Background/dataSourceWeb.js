
import { DATASOURCEMAP } from '@/config/dataSource';
import { storeDataSource } from './dataSourceUtils';

let tabCreatedByPado;
let activeTemplate = {};
let currExtentionId;
let isReadyRequest = false;
let operationType = null;

// inject-dynamic
export const dataSourceWebMsgListener = async (
  request,
  sender,
  sendResponse,
  password,
  port
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
      datasourceTemplate: { host, requests, responses },
      uiTemplate,
      id,
      event,
    } = activeTemplate;
    const exchangeName = activeTemplate.dataSource;
    const exchangeInfo = DATASOURCEMAP[exchangeName];
    const { constructorF, type: sourceType } = exchangeInfo;
    //let isStoreTiktokName = false;

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
      const isTarget = requests.some((r) => {
        if (r.queryParams && r.queryParams[0]) {
          const urlStrArr = currRequestUrl.split('?');
          const hostUrl = urlStrArr[0];
          let curUrlWithQuery = r.url === hostUrl;
          if (r.url === hostUrl) {
            curUrlWithQuery = isUrlWithQueryFn(currRequestUrl, r.queryParams);
          }
          if (curUrlWithQuery) {
            addQueryStr = curUrlWithQuery;
          }
          formatUrlKey = hostUrl;
          return !!curUrlWithQuery;
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
        checkWebRequestIsReadyFn();

        /*if (
          dataSource === 'tiktok' &&
          !isStoreTiktokName &&
          formatUrlKey === 'https://www.tiktok.com/passport/web/account/info/'
        ) {
          isStoreTiktokName = true;
          console.log('store tiktok username and jump page');
          const tiktok = new constructorF();
          const tiktokUsernamePre = await chrome.storage.local.get(
            'tiktokUsername'
          );
          await tiktok.storeUserName();
          const tiktokUsername = await chrome.storage.local.get(
            'tiktokUsername'
          );
          const currentTab = await chrome.tabs.get(tabCreatedByPado.id);
          if (
            currentTab.url === jumpTo + '/' &&
            !tiktokUsernamePre['tiktokUsername']
          ) {
            chrome.tabs.update(tabCreatedByPado.id, {
              url: jumpTo + '/@' + tiktokUsername['tiktokUsername'],
            });
          }
        }*/
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
        const storageObj = await chrome.storage.local.get(interceptorUrlArr);
        const storageArr = Object.values(storageObj);
        if (storageArr.length === interceptorUrlArr.length) {
          const f = interceptorRequests.every((r) => {
            // const storageR = Object.keys(storageObj).find(
            //   (sRKey) => sRKey === r.url
            // );
            const sRrequestObj = storageObj[r.url]
              ? JSON.parse(storageObj[r.url])
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
        console.log('web requests are captured');
        chrome.tabs.sendMessage(tabCreatedByPado.id, {
          type: 'dataSourceWeb',
          name: 'webRequestIsReady',
          params: {
            isReady: isReadyRequest,
          },
        });
      }
    };
    const formatRequestsFn = async () => {
      const formatRequests = [];
      for (const r of JSON.parse(JSON.stringify(requests))) {
        const { headers, cookies, body, url } = r;
        const formatUrlKey = url;
        const requestInfoObj = await chrome.storage.local.get([formatUrlKey]);
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
      console.log('222formatRequests', formatRequests);
      return formatRequests;
    };

    if (name === 'init') {
      operationType = operation;
      // const { extensionTabId } = request;
      // currExtentionId = extensionTabId;
      const currentWindowTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      currExtentionId = currentWindowTabs[0].id;
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

      /*const tiktokUsername = await chrome.storage.local.get('tiktokUsername');
      if (dataSource === 'tiktok' && tiktokUsername['tiktokUsername']) {
        jumpTo = jumpTo + '/@' + tiktokUsername['tiktokUsername'];
      }*/
      tabCreatedByPado = await chrome.tabs.create({
        url: jumpTo,
      });
      console.log('222pageWeb tabCreatedByPado', tabCreatedByPado);
      const injectFn = async () => {
        await chrome.scripting.executeScript({
          target: {
            tabId: tabCreatedByPado.id,
          },
          files: ['dataSourceWeb.bundle.js'],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tabCreatedByPado.id },
          files: ['static/css/dataSourceWeb.css'],
        });
      };
      await injectFn();
      checkWebRequestIsReadyFn();
      chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (
          tabId === tabCreatedByPado.id &&
          (changeInfo.url || changeInfo.title)
        ) {
          await injectFn();
          checkWebRequestIsReadyFn();
        }
      });

      chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
        if (tabId === tabCreatedByPado.id) {
          chrome.runtime.sendMessage({
            type: 'dataSourceWeb',
            name: 'stop',
          });
        }
      });
      // injectFn();
    }
    if (name === 'initCompleted') {
      console.log('content_scripts-bg-web receive:initCompleted');
      sendResponse({
        name: 'append',
        params: {
          ...activeTemplate,
        },
        dataSourcePageTabId: tabCreatedByPado.id,
        isReady: isReadyRequest,
        operation: operationType,
      });
    }
    if (name === 'start') {
      if (operation) {
        operationType = operation;
      }
      const formatRequests = await formatRequestsFn();
      if (operationType === 'connect') {
        const activeInfo = formatRequests.find((i) => i.headers);
        const activeHeader = Object.assign({}, activeInfo.headers);

        const authInfoName = exchangeName + '-auth';
        await chrome.storage.local.set({
          [authInfoName]: JSON.stringify(activeHeader),
        });
        const ex = new constructorF();
        await storeDataSource(exchangeName, ex, port);
      }
    }
   
    if (name === 'close' || name === 'cancel' || name === 'cancelByPado') {
      await chrome.tabs.update(currExtentionId, {
        active: true,
      });
      await chrome.tabs.remove(tabCreatedByPado.id);
    }
    if (name === 'end') {
      if (tabCreatedByPado) {
        chrome.tabs.sendMessage(
          tabCreatedByPado.id,
          request,
          function (response) {}
        );
        chrome.webRequest.onBeforeSendHeaders.removeListener(
          onBeforeSendHeadersFn
        );
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
      }
    }
  } else {
    if (name === 'end') {
      if (tabCreatedByPado) {
        chrome.tabs.sendMessage(
          tabCreatedByPado.id,
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
