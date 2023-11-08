import { assembleAlgorithmParams } from './exData';

let tabCreatedByPado;
let activeTemplate = {};
let currExtentionId;

// inject-dynamic
export const pageDecodeMsgListener = async (
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
  } = activeTemplate;
  const requestUrlList = requests.map((r) => r.url);
  const onBeforeSendHeadersFn = async (details) => {
    const { url: currRequestUrl, requestHeaders } = details;
    if (requestUrlList.includes(currRequestUrl)) {
      let formatHeader = requestHeaders.reduce((prev, curr) => {
        const { name, value } = curr;
        prev[name] = value;
        return prev;
      }, {});
      // const requestHeadersObj = JSON.stringify(formatHeader);
      const storageObj = await chrome.storage.local.get([currRequestUrl]);
      const currRequestUrlStorage = storageObj[currRequestUrl];
      const currRequestObj = currRequestUrlStorage
        ? JSON.parse(currRequestUrlStorage)
        : {};
      const newCurrRequestObj = {
        ...currRequestObj,
        headers: formatHeader,
      };
     
      const formatUrlKey = currRequestUrl;
      console.log('222222listen', currRequestUrl);
      await chrome.storage.local.set({
        [formatUrlKey]: JSON.stringify(newCurrRequestObj),
      });
    }
  };
  const onBeforeRequestFn = async (subDetails) => {
    const { url: currRequestUrl, requestBody } = subDetails;
    if (requestUrlList.includes(currRequestUrl)) {
      if (requestBody && requestBody.raw) {
        const rawBody = requestBody.raw[0];
        if (rawBody && rawBody.bytes) {
          const byteArray = new Uint8Array(rawBody.bytes);
          const bodyText = new TextDecoder().decode(byteArray);
          console.log(
            `url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
          );

          const storageObj = await chrome.storage.local.get([currRequestUrl]);
          const currRequestUrlStorage = storageObj[currRequestUrl];
          const currRequestObj = currRequestUrlStorage
            ? JSON.parse(currRequestUrlStorage)
            : {};
          const newCurrRequestObj = {
            ...currRequestObj,
            body: JSON.parse(bodyText),
          };
          await chrome.storage.local.set({
            [currRequestUrl]: JSON.stringify(newCurrRequestObj),
          });
        }
      }
    }
  };

  if (name === 'inject') {
    const { extensionTabId } = request;
    currExtentionId = extensionTabId;
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
    const injectFn = async () => {
      await chrome.scripting.executeScript({
        target: {
          tabId: tabCreatedByPado.id,
        },
        files: ['pageDecode.js'],
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tabCreatedByPado.id },
        files: ['pageDecode.css'],
      });
    };
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (tabId === tabCreatedByPado.id && changeInfo.url) {
        injectFn();
      }
    });
   
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      if (tabId === tabCreatedByPado.id) {
        chrome.runtime.sendMessage({
          type: 'pageDecode',
          name: 'abortAttest',
        });
      }
    });
    injectFn();
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
    // debugger
    const { category } = activeTemplate;
    const form = {
      source: dataSource,
      type: category,
      label: null, // TODO
      exUserId: null,
    };
    if (activeTemplate.requestid) {
      form.requestid = activeTemplate.requestid;
    }
    let aligorithmParams = await assembleAlgorithmParams(form, password);

    const formatRequests = [];
    for (const r of requests) {
      const { headers, cookies, body, url } = r;
      const formatUrlKey = url
      const requestInfoObj = await chrome.storage.local.get([formatUrlKey]);
     
      const { headers: curRequestHeader, body: curRequestBody } = (requestInfoObj[url] && JSON.parse(
        requestInfoObj[url]
      )) || {};
      // debugger
      const cookiesObj =
        curRequestHeader? parseCookie(curRequestHeader.Cookie): {};
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
      formatRequests.push(r);
    }

    Object.assign(aligorithmParams, {
      reqType: 'web',
      host,
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
    chrome.tabs.sendMessage(tabCreatedByPado.id, request, function (response) {
    });
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

const parseCookie = str =>
  str
  .split(';')
  .map(v => v.split('='))
  .reduce((acc, v) => {
    acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
    return acc;
  }, {});
