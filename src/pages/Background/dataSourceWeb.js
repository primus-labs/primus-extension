
let tabCreatedByPado;
let activeTemplate = {};
let currExtentionId;

// inject-dynamic
export const dataSourceWebMsgListener = async (
  request,
  sender,
  sendResponse,
  password
) => {
  const { name, params } = request;
  activeTemplate = name === 'inject' ? params : activeTemplate;
  const {
    dataSource,
    jumpTo,
    schemaType,
    datasourceTemplate: { host, requests, responses },
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
      console.log('222222listen', formatUrlKey);
      await chrome.storage.local.set({
        [formatUrlKey]: JSON.stringify(newCurrRequestObj),
      });
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
    const isReady = await checkReadyStatusFn();
    console.log('web requests are captured');
    chrome.tabs.sendMessage(tabCreatedByPado.id, {
      type: 'dataSourceWeb',
      name: 'webRequestIsReady',
      params: {
        isReady,
      },
    });
  };

  if (name === 'inject') {
    console.log('yyyinject', );
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

    tabCreatedByPado = await chrome.tabs.create({
      url: jumpTo,
    });
    console.log('222pageDEcode tabCreatedByPado', tabCreatedByPado);
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
          name: 'abortAttest',
        });
      }
    });
    // injectFn();
  }
  if (name === 'injectionCompleted') {
    sendResponse({
      name: 'append',
      params: {
        ...activeTemplate,
      },
      dataSourcePageTabId: tabCreatedByPado.id,
    });
  }
  if (name === 'sendRequest') {
    /*const dataSourceCookies = await chrome.cookies.getAll({
      url: new URL(jumpTo).origin,
    });
    const cookiesObj = dataSourceCookies.reduce((prev, curr) => {
      const { name, value } = curr;
      prev[name] = value;
      return prev;
    }, {});*/

    // const { category } = activeTemplate;
    // const form = {
    //   source: dataSource,
    //   type: category,
    //   label: null, // TODO
    //   exUserId: null,
    // };
    // // console.log(WorkerGlobalScope.location)
    // if (event) {
    //   form.event = event;
    // }
    // if (activeTemplate.requestid) {
    //   form.requestid = activeTemplate.requestid;
    // }
    // let aligorithmParams = await assembleAlgorithmParams(form, password);

    const formatRequests = [];
    for (const r of requests) {
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

    Object.assign(aligorithmParams, {
      reqType: 'web',
      host: host,
      schemaType,
      requests: formatRequests,
      responses,
      uiTemplate,
      templateId: id,
    });
    await chrome.storage.local.set({
      activeRequestAttestation: JSON.stringify(aligorithmParams),
    });
    console.log('222222pageDecode-aligorithmParams', aligorithmParams);
    chrome.runtime.sendMessage({
      type: 'algorithm',
      method: 'getAttestation',
      params: aligorithmParams,
    });
  }

  if (name === 'attestResult') {
    // to send back your response  to the current tab
    chrome.tabs.sendMessage(
      tabCreatedByPado.id,
      request,
      function (response) {}
    );
    chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeadersFn);
    chrome.webRequest.onBeforeRequest.addListener(onBeforeRequestFn);
  }
  if (name === 'closeDataSourcePage' || name === 'cancelAttest') {
    await chrome.tabs.update(currExtentionId, {
      active: true,
    });
    const { dataSourcePageTabId } = request;

    await chrome.tabs.remove(dataSourcePageTabId);
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
