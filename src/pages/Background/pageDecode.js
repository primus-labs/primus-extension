const DYNAMIC_SCRIPT_ID = 'dynamic-script';
chrome.webNavigation.onDOMContentLoaded.addListener(async ({ tabId, url }) => {
  console.log('pado-bg-webNavigation', tabId, url);
  if (url !== 'https://www.binance.com/zh-CN/my/dashboard') return;

  async function isDynamicContentScriptRegistered() {
    const scripts = await chrome.scripting.getRegisteredContentScripts();

    return scripts.some((s) => s.id === DYNAMIC_SCRIPT_ID);
  }
  const dynamicContentScriptRegistered =
    await isDynamicContentScriptRegistered();

  if (dynamicContentScriptRegistered) {
    await chrome.scripting.unregisterContentScripts({
      ids: [DYNAMIC_SCRIPT_ID],
    });
  }
  await chrome.scripting.registerContentScripts([
    {
      id: 'dynamic-script',
      js: ['pageDecode.js'],
      // persistAcrossSessions: false,
      matches: ['https://www.binance.com/zh-CN/my/dashboard'],
      // runAt: 'document_start',
      // allFrames: false,
      // world: 'ISOLATED',
    },
  ]);
  await chrome.scripting.insertCSS({
    files: ['pageDecode.css'],
    target: { tabId: tabId },
  });
});

// // inject-dynamic
chrome.runtime.onMessage.addListener(async ({ name, options }) => {
  if (name === 'inject-dynamic-pageDecode') {
    await chrome.tabs.create({
      url: 'https://www.binance.com/zh-CN/my/dashboard',
    });
  }
  if (name === 'pageDecode-send-request') {
    request().then((r) => {});
  }
});
async function request() {
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
  sendRequest(
    url,
    method,
    body,
    JSON.parse(header),
    function (response) {
      // 处理响应数据
      alert('Received response:' + response);
    },
    function (response) {
      // 处理响应数据
      alert('Error response:' + response);
    }
  );
}
function sendRequest(
  url,
  method,
  body,
  headers,
  successCallback,
  errorCallback
) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // 请求成功，执行成功回调并传递响应数据
        successCallback(xhr.responseText);
      } else {
        // 请求失败，执行错误回调并传递错误信息
        errorCallback('Request failed with status: ' + xhr.status);
      }
    }
  };
  xhr.onerror = function () {
    // 发生网络错误，执行错误回调并传递错误信息
    errorCallback('Network error occurred');
  };
  xhr.open(method, url, true);

  // 设置请求头
  for (var i = 0; i < headers.length; i++) {
    xhr.setRequestHeader(headers[i].name, headers[i].value);
  }

  xhr.send(body); // 发送请求主体
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
