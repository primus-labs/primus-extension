import {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
} from '@/services/user';
import { getExchangeDataAsync } from '@/store/actions';
import { getCurrentDate } from '@/utils/utils';
import { DATASOURCEMAP } from '@/utils/constants';
import store from '@/store/index';
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

const EXCHANGEINFO = {
  binance: {
    name: 'binance',
    apiKey: '',
    secretKey: '',
  },
  okx: {
    name: 'okx',
    apiKey: '',
    secretKey: '',
    passphase: '',
  },
  kucoin: {
    name: 'kucoin',
    apiKey: '',
    secretKey: '',
    passphase: '',
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
    case 'fullscreen':
      console.log('fullscreen connectted port=', port);
      port.onMessage.addListener(processFullscreenReq);
      break;
    default:
      break;
  }
});

const processFullscreenReq = (message, port) => {
  switch (message.fullScreenType) {
    case 'padoService':
      processpadoServiceReq(message, port);
      break;
    case 'networkreq':
      processNetworkReq(message, port);
      break;
    case 'storage':
      processStorageReq(message, port);
    default:
      break;
  }
};

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
    params: { apiKey, secretKey, passphase },
  } = message;

  switch (type) {
    case 'exchange-binance':
    case 'exchange-okx':
    case 'exchange-kucoin':
      const exchangeName = type.split('-')[1];
      EXCHANGEINFO[exchangeName] = { name: exchangeName, apiKey, secretKey };
      DATASOURCEMAP[exchangeName].requirePassphase &&
        (EXCHANGEINFO[exchangeName].passphase = passphase);
      await store.dispatch(getExchangeDataAsync(EXCHANGEINFO[exchangeName]));
      const { totalBalance, tokenListMap } = store.getState()[exchangeName];
      const exchangeData = {
        apiKey,
        secretKey, // TODO encryption
        totalBalance,
        tokenListMap,
        date: getCurrentDate(),
      };
      chrome.storage.local.set(
        { [exchangeName]: JSON.stringify(exchangeData) },
        () => {
          port.postMessage({ resType: type, res: true });
        }
      );
      break;
    default:
      break;
  }
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

const processStorageReq = async (message, port) => {
  console.log('processStorageReq message', message);
  const { key, value } = message;
  chrome.storage.local.set({ [key]: value });
};
