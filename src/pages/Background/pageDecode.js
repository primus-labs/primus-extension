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
      // console.log('222222details', details);
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
      await chrome.storage.local.set({
        [currRequestUrl]: JSON.stringify(newCurrRequestObj),
      });
      console.log(
        '222222requestInfo-headers',
        currRequestUrl,
        newCurrRequestObj
      );
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
          console.log(
            '222222requestInfo-body',
            currRequestUrl,
            newCurrRequestObj
          );
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
    console.log('222222tabCreatedByPado', tabCreatedByPado);
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
      console.log('222222tabUpdate', tabId, changeInfo, tab);
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
    const dataSourceCookies = await chrome.cookies.getAll({
      url: new URL(jumpTo).origin,
    });
    const cookiesObj = dataSourceCookies.reduce((prev, curr) => {
      const { name, value } = curr;
      prev[name] = value;
      return prev;
    }, {});
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
      const requestInfoObj = await chrome.storage.local.get([url]);

      const { headers: curRequestHeader, body: curRequestBody } = JSON.parse(
        requestInfoObj[url]
      );
      let formateHeader = {},
        formateCookie = {},
        formateBody = {};
      console.log(
        '222222requestInfoObj',
        JSON.parse(requestInfoObj[url]),
        headers,
        cookies
      );
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
    console.log('222222pageDecode-params', aligorithmParams);
    chrome.runtime.sendMessage({
      type: 'algorithm',
      method: 'getAttestation',
      params: aligorithmParams,
    });
  }

  console.log('222222bg received:', name, sender, sendResponse);

  if (name === 'attestResult') {
    console.log('222222attestResult--bg', tabCreatedByPado.id, request);
    // to send back your response  to the current tab
    chrome.tabs.sendMessage(tabCreatedByPado.id, request, function (response) {
      console.log('222222chrome.tabs.responseMessage', response);
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
