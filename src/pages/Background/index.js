import {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
} from '@/services/user';
import Binance from '@/services/exchange/binance';
import Module from './hello';
Module['onRuntimeInitialized'] = () => {
  Module.ccall(
    'myFunction', // name of C function
    null, // return type
    null, // argument types
    null // arguments
  );
};
const padoServices = {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
};
const networkreq = {
  'exchange-binance': Binance,
};
const EXCHANGEINFO = {
  binance: {
    apiKey: '',
    secretKey: '',
    // TODO DEL!!!
    // apiKey: 'AH2jrvzC91cNrgItJhTftQTfhwnqbT573ZdnjYeTrVUUJFaojyxBM8fhk0vzt9lH', // TODO DEL!!!
    //     secretKey:
    //       '8qOOSo8JVNahkwTkVMWvYbz9TKnk4rNdeUXO5REwULe0WewkGb9VUi2wN0oXykIO', // TODO DEL!!!
  },
};
chrome.runtime.onInstalled.addListener(({ reason, version }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    showIndex();
  }
});

chrome.action.onClicked.addListener((tab) => {
  showIndex();
});

const showIndex = (info, tab) => {
  let url = chrome.runtime.getURL('home.html');
  chrome.tabs.create({ url });
};

// listen msg from extension tab page
chrome.runtime.onConnect.addListener((port) => {
  console.log('port', port);
  switch (port.name) {
    case 'invokealgo':
      console.log('invokealgo connectted port=', port);
      port.onMessage.addListener(processAlgoMsg);
      break;
    case 'networkreq':
      console.log('networkreq connectted port=', port);
      port.onMessage.addListener(processNetworkReq);
      break;
    case 'padoService':
      console.log('padoService connectted port=', port);
      port.onMessage.addListener(processpadoServiceReq);
      break;
    // case "storage":
    //   console.log("storage connectted port=", port);
    //   port.onMessage.addListener(processStorage);
    //   break;
    default:
      break;
  }
});

/*
message : {
  requestId,
  algoMethod, // start or getData
  algoParams { // this is getData params, start only proxyUrl
    source,
    host,
    path,
    appKey,
    appSecret,
    netMethod,
    netParams
  }
}
*/
const processAlgoMsg = (message, port) => {
  switch (message.algoMethod) {
    case 'start':
      console.log('recv start=', message.algoParams.proxyUrl);
      Module.ccall(
        'myFunction', // name of C function
        null, // return type
        null, // argument types
        null // arguments
      );
      port.postMessage({ requestId: message.requestId, result: 'success' });
      break;
    case 'getData':
      break;
    default:
      break;
  }
};

/*
message : {
  requestId,
  type,
  params {
    appKey,
    appSecret,
    functionName,
    funcParams
  }
}
*/
const processNetworkReq = async (message, port) => {
  const {
    type,
    params: { apiKey, secretKey },
  } = message;
  switch (type) {
    case 'exchange-binance':
      EXCHANGEINFO.binance = { apiKey, secretKey };
      const ex = new networkreq[type]({ apiKey, secretKey });
      const res = await ex.getInfo();
      console.log('binance account info', ex);
      port.postMessage({ resType: type, res: true });
      // const response = await processBinaceReq(message);
      // console.log('exchange-binance response', response);
      // port.postMessage({
      //   requestId: message.requestId,
      //   type: message.type,
      //   function: message.params.functionName,
      //   data: response,
      // });
      break;
    default:
      break;
  }
};

const processBinaceReq = async (message) => {
  const res = await fetch('https://api.binance.com/sapi/v1/system/status');
  const resJson = res.json();
  return resJson;
};

const processpadoServiceReq = async (message, port) => {
  const { reqMethodName, params = {}, config = {} } = message;
  const { rc, result } = await padoServices[reqMethodName](
    { ...params },
    { ...config }
  );
  switch (reqMethodName) {
    case 'getAllOAuthSources':
      if (rc === 0) {
        port.postMessage({ resMethodName: reqMethodName, res: result });
      }
      break;
    case 'checkIsLogin':
      if (rc === 0) {
        port.postMessage({ resMethodName: reqMethodName, res: true });
        chrome.storage.local.set({ userInfo: JSON.stringify(result) });
      } else {
        port.postMessage({ resMethodName: reqMethodName, res: false });
      }
      break;
    case 'bindUserAddress':
      port.postMessage({ resMethodName: reqMethodName, res: rc === 0 });
      break;
    default:
      break;
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message, sender, sendResponse);
  const { type, key, value } = message;
  if (type === 'storage') {
    chrome.storage.local.set({ [key]: value });
  }
});
