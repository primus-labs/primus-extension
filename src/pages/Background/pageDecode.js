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
const proofTemplateList = [
  schemaInfo
]
const allJumpUrlList = proofTemplateList.map(t => t.jumpTo)
let tabCreatedByPado;
// inject-dynamic
export const pageDecodeMsgListener = async (
  request,
  sender,
  sendResponse,
  password
) => {
  const { name, params} = request;
  if (name === 'inject') {
    // yyy
    // const { jumpTo, datasourceTemplate: { requests } } = schemaInfo
    // const requestUrlList = requests.map(r => r.url)
    // chrome.webRequest.onBeforeSendHeaders.addListener(
    //   async (details) => {
    //     const {url: currRequestUrl,requestHeaders} = details
    //     if (requestUrlList.includes(currRequestUrl)) {
    //       console.log('222222details', details);
    //       let formatHeader = requestHeaders.reduce((prev, curr) => {
    //         const { name, value } = curr;
    //         prev[name] = value;
    //         return prev;
    //       }, {});
    //       const requestHeadersObj = JSON.stringify(formatHeader);
    //       const storageObj = await chrome.storage.local.get([currRequestUrl]);
    //       const currRequestUrlStorage = storageObj[currRequestUrl]
    //       const currRequestObj = currRequestUrlStorage ? JSON.parse(currRequestUrlStorage) : {}
    //       const newCurrRequestObj = { ...currRequestObj, 
    //         headers: requestHeadersObj,
    //       }
    //       await chrome.storage.local.set({
    //         [currRequestUrl]: JSON.stringify(newCurrRequestObj)
    //       });
    //       console.log('222222requestInfo', newCurrRequestObj);
    //     }
    //   },
    //   { urls: ['<all_urls>'] },
    //   ['requestHeaders', 'extraHeaders']
    // );
    // chrome.webRequest.onBeforeRequest.addListener(
    //   async(subDetails) => {
    //     const {url: currRequestUrl, requestBody, } = subDetails
    //     if (requestUrlList.includes(currRequestUrl)) {
    //       if (requestBody && requestBody.raw) {
    //         const rawBody = requestBody.raw[0];
    //         if (rawBody && rawBody.bytes) {
    //           const byteArray = new Uint8Array(rawBody.bytes);
    //           const bodyText = new TextDecoder().decode(byteArray);
    //           console.log(
    //             `url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
    //           );

    //           const storageObj = await chrome.storage.local.get([currRequestUrl]);
    //           const currRequestUrlStorage = storageObj[currRequestUrl]
    //           const currRequestObj = currRequestUrlStorage ? JSON.parse(currRequestUrlStorage) : {}
    //           const newCurrRequestObj = { ...currRequestObj, 
    //             body: bodyText,
    //           }
    //           await chrome.storage.local.set({
    //             [currRequestUrl]: JSON.stringify(newCurrRequestObj)
    //           });
    //           console.log('222222requestInfo', newCurrRequestObj);
    //         }
    //       }
    //     }
    //   },
    //   { urls: ['<all_urls>'] },
    //   ['requestBody']
    // );
    // const tabCreatedByPado = await chrome.tabs.create({
    //   url: jumpTo
    // });
    //yyy
    



    tabCreatedByPado = await chrome.tabs.create({
      url: 'https://www.binance.com/zh-CN/my/dashboard'
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
    const { binance_body, binance_header } = await chrome.storage.local.get([
      'binance_body',
      'binance_header',
    ]);
    const dataSourceCookies = await chrome.cookies.getAll({
      url: 'https://www.binance.com',
    });
    const cookiesObj = dataSourceCookies.reduce((prev, curr) => {
      const { name, value } = curr;
      prev[name] = value;
      return prev;
    }, {});
    const form = {
      source: 'binance',
      type: 'KYC',
      baseValue: '2',
      // token: null,
      label: null, // TODO
      exUserId: null,
    };
    let aligorithmParams = await assembleAlgorithmParams(form, password);
    
    const {
      schemaType,
      datasourceTemplate: { host, requests, responses },
    } = schemaInfo;
    const formatRequests = requests.map( (r) => {
      const { headers, cookies, body } = r;
      let formateHeader = {},
        formateCookie = {},
        formateBody = {};
      if (headers && headers.length > 0) {
        headers.forEach((hk) => {
          const binance_headerObj = JSON.parse(binance_header);
          const inDataSourceHeaderKey = Object.keys(binance_headerObj).find(
            (h) => h.toLowerCase() === hk.toLowerCase()
          );
          formateHeader[hk] = binance_headerObj[inDataSourceHeaderKey];
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
          formateBody[hk] = JSON.parse(binance_body)[hk];
        });
        Object.assign(r, {
          body: formateBody,
        });
      }

      return r;
    });
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
      // exInfo: EXCHANGEINFO,// ???TODO
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
    });
  
    await chrome.tabs.remove(tabCreatedByPado.id);

  }
};

// Listen to request header information
chrome.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    const targetRequestUrl =
      'https://www.binance.com/bapi/accounts/v1/private/account/user/base-detail';
    if (details.url === targetRequestUrl) {
      console.log('222222details', details);
      let formatHeader = details.requestHeaders.reduce((prev, curr) => {
        const { name, value } = curr;
        prev[name] = value;
        return prev;
      }, {});
      const requestHeaders = JSON.stringify(formatHeader);
      const requestInfo = {
        binance_header: requestHeaders,
        
      };

      console.log('222222requestInfo', requestInfo);
      chrome.storage.local.set(requestInfo, function () {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log(`binance request info:`, requestInfo);
        }
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders', 'extraHeaders']
);

chrome.webRequest.onBeforeRequest.addListener(
  (subDetails) => {
    if (
      subDetails.url ===
      'https://www.binance.com/bapi/accounts/v1/private/account/user/base-detail'
    ) {
      if (subDetails.requestBody && subDetails.requestBody.raw) {
        const rawBody = subDetails.requestBody.raw[0];
        if (rawBody && rawBody.bytes) {
          const byteArray = new Uint8Array(rawBody.bytes);
          const bodyText = new TextDecoder().decode(byteArray);
          console.log(
            `url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
          );
          chrome.storage.local.set({ binance_body: bodyText }, function () {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
            } else {
              console.log(`binance request body:`, bodyText);
            }
          });
        }
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);
