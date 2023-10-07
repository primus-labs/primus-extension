import { assembleAlgorithmParams } from './exData';
// TODO all jump url
// all request url
const schemaInfo = {
  id: '1',
  schemaType: 'BINANCE_KYC_LEVEL#1',
  name: 'binance kyc level',
  category: 'KYC',
  description: 'kyc level must >= 2',
  dataSource: 'binance',
  jumpTo: 'https://www.binance.com/zh-CN/my/dashboard',
  uiTemplate: {
    icon: '',
    bgColor: '',
    bgImage: '',
  },
  datasourceTemplate: {
    host: 'www.binance.com',
    requests: [
      {
        name: 'first',
        url: 'https://www.binance.com/bapi/accounts/v2/public/account/ip/country-city-short',
      },
      {
        name: 'kyc',
        url: 'https://www.binance.com/bapi/accounts/v1/private/account/user/base-detail',
        method: 'POST',
        headers: ['Clienttype', 'Csrftoken', 'User-Agent'],
        cookies: ['p20t'],
      },
    ],
    responses: [
      {},
      {
        conditions: [
          {
            type: 'FieldRange',
            field: '.data.jumioEnable',
            op: '=',
            value: '1',
          },
          {
            type: 'FieldRange',
            field: '.data.level',
            op: '>=',
            value: '2',
          },
        ],
      },
    ],
  },
};
const proofTemplateList = [schemaInfo];
const allJumpUrlList = proofTemplateList.map((t) => t.jumpTo);
let tabCreatedByPado;
// inject-dynamic
export const pageDecodeMsgListener = async (
  request,
  sender,
  sendResponse,
  password
) => {
  const { name, params } = request;
  const { dataSource } = params;
  const schemaInfo = proofTemplateList.find((i) => i.dataSource === dataSource);

  const {
    jumpTo,
    schemaType,
    datasourceTemplate: { host, requests, responses },
  } = schemaInfo;
  const requestUrlList = requests.map((r) => r.url);
  const onBeforeSendHeadersFn = async (details) => {
    const { url: currRequestUrl, requestHeaders } = details;
    if (requestUrlList.includes(currRequestUrl)) {
      console.log('222222details', details);
      let formatHeader = requestHeaders.reduce((prev, curr) => {
        const { name, value } = curr;
        prev[name] = value;
        return prev;
      }, {});
      const requestHeadersObj = JSON.stringify(formatHeader);
      const storageObj = await chrome.storage.local.get([currRequestUrl]);
      const currRequestUrlStorage = storageObj[currRequestUrl];
      const currRequestObj = currRequestUrlStorage
        ? JSON.parse(currRequestUrlStorage)
        : {};
      const newCurrRequestObj = {
        ...currRequestObj,
        headers: requestHeadersObj,
      };
      await chrome.storage.local.set({
        [currRequestUrl]: JSON.stringify(newCurrRequestObj),
      });
      console.log('222222requestInfo', newCurrRequestObj);
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
          const newCurrRequestObj = { ...currRequestObj, body: bodyText };
          await chrome.storage.local.set({
            [currRequestUrl]: JSON.stringify(newCurrRequestObj),
          });
          console.log('222222requestInfo', newCurrRequestObj);
        }
      }
    }
  };
  if (name === 'inject') {
    // chrome.webRequest.onBeforeSendHeaders.addListener(
    //   onBeforeSendHeadersFn,
    //   { urls: ['<all_urls>'] },
    //   ['requestHeaders', 'extraHeaders']
    // );
    // chrome.webRequest.onBeforeRequest.addListener(
    //   onBeforeRequestFn,
    //   { urls: ['<all_urls>'] },
    //   ['requestBody']
    // );
    tabCreatedByPado = await chrome.tabs.create({
      url: jumpTo,
    });
    console.log('222222tabCreatedByPado', tabCreatedByPado);
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
    const { category } = schemaInfo;
    const form = {
      source: dataSource,
      type: category,
      baseValue: '0', // Arbitrary value
      label: null, // TODO
      exUserId: null,
    };
    let aligorithmParams = await assembleAlgorithmParams(form, password);


    const formatRequests = [];
    for (const r of requests) {
      const { headers, cookies, body, url } = r;
      const requestInfoObj = await chrome.storage.local.get([url]);
      const { header: curRequestHeader, body: curRequestBody } = JSON.parse(
        requestInfoObj[url]
      );
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
      }
      if (cookies && cookies.length > 0) {
        cookies.forEach((ck) => {
          formateCookie[ck] = cookiesObj[ck];
        });
      }
      if (body && body.length > 0) {
        body.forEach((hk) => {
          formateBody[hk] = curRequestBody[hk];
        });
      }
      formatRequests.push(
        Object.assign(r, {
          headers: formateHeader,
          cookies: formateCookie,
          body: formateBody,
        })
      );
    }

    Object.assign(aligorithmParams, {
      reqType: 'web',
      host,
      schemaType,
      requests: formatRequests,
      responses,
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
  // const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('222222bg received:', name, sender, sendResponse);
  if (name === 'injectionCompleted') {
    sendResponse({
      name: 'append',
    });
  }
  if (name === 'attestSuc') {
    console.log('222222attestSuc--bg', tabCreatedByPado.id);
    sendResponse({
      name: 'attestSuc',
      params: {
        dataSource: 'binance',
      },
    });
    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersFn);
    chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
   
    await chrome.tabs.remove(tabCreatedByPado.id);
  }
};
