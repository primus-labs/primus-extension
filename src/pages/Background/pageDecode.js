import { dataSourceRequest } from '@/utils/request';

// // inject-dynamic
export const pageDecodeMsgListener = async (request, sender, sendResponse) => {
  const { name, options } = request;
  if (name === 'inject') {
    const tabCreatedByPado = await chrome.tabs.create({
      url: 'https://www.binance.com/zh-CN/my/dashboard',
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
    requestF().then((r) => {});
  }
  // const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('222222bg received:', name, sender, sendResponse);
  if (name === 'injectionCompleted') {
    sendResponse({
      name: 'append',
    });
  }
  if (name === 'startDataSourceAttest') {
    requestF().then((r) => {
      sendResponse(r)
    });
  }
};

async function requestF() {
  const {
    binance_url: url,
    binance_method: method,
    binance_body: body,
    binance_header: header,
  } = await chrome.storage.local.get([
    'binance_url',
    'binance_method',
    'binance_body',
    'binance_header',
  ]);
  const formatHeader = JSON.parse(header).reduce((prev, curr) => {
    const { name, value } = curr;
    prev[name] = value;
    return prev;
  }, {});

  const requestParams = {
    method: method,
    url: url,
    data: JSON.parse(body),
    header: formatHeader,
  };
  console.log('requestParams', requestParams);
  dataSourceRequest(requestParams)
    .then((res) => {
      console.log('222222Biannce request res: ', res);
    })
    .catch((e) => {
      console.log('222222Biannce request error: ', e);
    });
}
// Listen to request header information
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const requestHeaders = JSON.stringify(details.requestHeaders);
    if (
      details.url ===
      'https://www.binance.com/bapi/accounts/v1/private/account/user/base-detail'
    ) {
      const requestInfo = {
        binance_url: details.url,
        binance_method: details.method,
        binance_header: requestHeaders,
      };
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
  ['requestHeaders']
);

chrome.webRequest.onBeforeRequest.addListener(
  (subDetails) => {
    if (subDetails.requestBody && subDetails.requestBody.raw) {
      const rawBody = subDetails.requestBody.raw[0];
      if (rawBody && rawBody.bytes) {
        const byteArray = new Uint8Array(rawBody.bytes);
        const bodyText = new TextDecoder().decode(byteArray);
        console.log(
          `url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
        );
        if (
          subDetails.url ===
          'https://www.binance.com/bapi/accounts/v1/private/account/user/base-detail'
        ) {
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
