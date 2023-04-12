import {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
  refreshAuthData,
} from '@/services/user';
import { getSysConfig } from '@/services/config';

import { getSocialDataAction } from '@/store/actions';
import { getCurrentDate, getSingleStorageSyncData } from '@/utils/utils';
import { DATASOURCEMAP } from '@/utils/constants';
import store from '@/store/index';
import { encrypt, decrypt } from '@/utils/crypto';
import Module from './hello';
const Web3EthAccounts = require('web3-eth-accounts');

Module['onRuntimeInitialized'] = () => {
  Module.ccall(
    'myFunction', // name of C function
    null, // return type
    null, // argument types
    null // arguments
  );
};
let web3EthAccount = new Web3EthAccounts();
const padoServices = {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
  getSysConfig,
  refreshAuthData,
};

let EXCHANGEINFO = {
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
  coinbase: {
    name: 'coinbase',
    apiKey: '',
    secretKey: '',
  },
};

let USERPASSWORD = '';

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
      port.onDisconnect.addListener(onDisconnectFullScreen);
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
      break;
    case 'wallet':
      processWalletReq(message, port);
      break;
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
  var {
    type,
    params: { apiKey, secretKey, passphase, name, exData },
  } = message;
  const exchangeName = type.split('-')[1];
  switch (type) {
    case 'getKey-binance':
    case 'getKey-okx':
    case 'getKey-kucoin':
    case 'getKey-coinbase':
      const cipherData = await chrome.storage.local.get(
        exchangeName + 'cipher'
      );
      // console.log(1111, cipherData, USERPASSWORD);
      const apiKeyInfo = JSON.parse(
        decrypt(cipherData[exchangeName + 'cipher'], USERPASSWORD)
      );
      port.postMessage({
        resType: type,
        res: { ...apiKeyInfo, name: exchangeName },
      });
      break;
    case 'setData-binance':
    case 'setData-okx':
    case 'setData-kucoin':
    case 'setData-coinbase':
      EXCHANGEINFO[exchangeName] = {
        apiKey,
        secretKey,
        passphase,
        name: exchangeName,
      };
      const exCipherData = {
        apiKey,
        secretKey,
        passphase,
      };
      const encryptedKey = encrypt(JSON.stringify(exCipherData), USERPASSWORD);
      console.log(
        '$$$==========',
        exchangeName,
        exData,
        encryptedKey,
        store.getState()
      );
      chrome.storage.local.set(
        {
          [exchangeName]: JSON.stringify(exData),
          [exchangeName + 'cipher']: JSON.stringify(encryptedKey),
        },
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
  const formatParams = { ...params };
  delete formatParams.password;
  const { rc, result, mc } = await padoServices[reqMethodName](
    { ...formatParams },
    {
      ...config,
    }
  );
  switch (reqMethodName) {
    case 'getAllOAuthSources':
      if (rc === 0) {
        port.postMessage({ resMethodName: reqMethodName, res: result });
      }
      break;
    case 'checkIsLogin':
      if (rc === 0) {
        if (params.data_type === 'LOGIN') {
          await chrome.storage.local.set({ userInfo: JSON.stringify(result) }); // TODO
          port.postMessage({ resMethodName: reqMethodName, res: true });
        } else {
          const lowerCaseSourceName = params.source.toLowerCase();
          const socialSourceData = {
            ...result,
            date: getCurrentDate(),
          };
          await chrome.storage.local.set({
            [lowerCaseSourceName]: JSON.stringify(socialSourceData),
          }); // TODO
          // debugger;
          port.postMessage({
            resMethodName: reqMethodName,
            res: socialSourceData,
          });
        }
      } else {
        port.postMessage({ resMethodName: reqMethodName, res: false });
      }
      break;
    case 'bindUserAddress':
      if (rc === 0) {
        const msg = {
          fullScreenType: 'wallet',
          reqMethodName: 'encrypt',
          params: {
            password: params.password,
          },
        };
        await processWalletReq(msg, port);
        port.postMessage({ resMethodName: reqMethodName, res: true });
      } else {
        port.postMessage({ resMethodName: reqMethodName, res: false });
      }
      break;
    case 'getSysConfig':
      if (rc === 0) {
        port.postMessage({ resMethodName: reqMethodName, res: result });
      }
      break;
    case 'refreshAuthData':
      if (rc === 0) {
        const lowerCaseSourceName = params.source.toLowerCase();
        const socialSourceData = {
          ...result,
          date: getCurrentDate(),
        };
        const storageObj = {
          [lowerCaseSourceName]: JSON.stringify(getSocialDataAction),
        };
        await chrome.storage.local.set(storageObj);
        // await store.dispatch(
        //   getSocialDataAction({
        //     [lowerCaseSourceName]: socialSourceData,
        //   })
        // );
        port.postMessage({
          resMethodName: reqMethodName,
          res: socialSourceData,
        });
      } else if (rc === 1 && mc === 'UNAUTHORIZED_401') {
        //Token expiration
        port.postMessage({ resMethodName: reqMethodName, res: mc });
      } else {
        port.postMessage({ resMethodName: reqMethodName, res: false });
      }
      break;
    default:
      break;
  }
};

const processStorageReq = async (message, port) => {
  console.log('processStorageReq message', message);
  const { type, key, value } = message;
  switch (type) {
    case 'set':
      await chrome.storage.local.set({ [key]: value });
      break;
    case 'get':
      const res = await chrome.storage.local.get(key);
      if (key.endsWith('cipher')) {
        const valStr = res[key];
        const val = JSON.parse(decrypt(valStr, USERPASSWORD));
        // const { apiKey, secretKey, passphase } = val
        port.postMessage({
          resType: 'get',
          key: key,
          value: val,
        });
      }
      break;
    case 'remove':
      await chrome.storage.local.remove(key);
      break;
    default:
      break;
  }
};

const processWalletReq = async (message, port) => {
  console.log('processWalletReq message', message);
  const {
    reqMethodName,
    params: { password },
  } = message;
  let transferMsg;
  switch (reqMethodName) {
    case 'decrypt':
      chrome.storage.local.get(['keyStore'], (storedData) => {
        const keyStore = storedData['keyStore'];
        if (keyStore) {
          try {
            web3EthAccount = new Web3EthAccounts();
            web3EthAccount.decrypt(keyStore, password);
            USERPASSWORD = password;
            port.postMessage({ resMethodName: reqMethodName, res: true });
          } catch {
            port.postMessage({ resMethodName: reqMethodName, res: false });
          }
        }
      });
      break;
    case 'encrypt':
      let privateKey = await getSingleStorageSyncData('privateKey');
      const orignAccount = web3EthAccount.privateKeyToAccount(privateKey);
      const encryptAccount = orignAccount.encrypt(password);
      USERPASSWORD = password;
      transferMsg = {
        fullScreenType: 'storage',
        type: 'set',
        key: 'keyStore',
        value: JSON.stringify(encryptAccount),
      };
      await processStorageReq(transferMsg, port);

      const transferRemoveMsg = {
        fullScreenType: 'storage',
        type: 'remove',
        key: 'privateKey',
      };
      await processStorageReq(transferRemoveMsg, port);
      break;
    case 'clearUserPassword':
      USERPASSWORD = '';
      EXCHANGEINFO = {};
      web3EthAccount = null;
      break;
    case 'queryUserPassword':
      port.postMessage({ resMethodName: reqMethodName, res: !!USERPASSWORD });
      break;
    case 'create':
      try {
        let privateKey = await getSingleStorageSyncData('privateKey');
        let acc;
        if (privateKey) {
          acc = web3EthAccount.privateKeyToAccount(privateKey);
        } else {
          acc = web3EthAccount.create();
          transferMsg = {
            fullScreenType: 'storage',
            type: 'set',
            key: 'privateKey',
            value: acc.privateKey,
          };
          await processStorageReq(transferMsg, port);
        }
        port.postMessage({ resMethodName: reqMethodName, res: acc.address });
      } catch {
        port.postMessage({ resMethodName: reqMethodName, res: '' });
      }
      break;
    default:
      break;
  }
};

const onDisconnectFullScreen = (port) => {
  console.log('onDisconnectFullScreen port', port);
  port.onDisconnect.removeListener(onDisconnectFullScreen);
  port.onMessage.removeListener(processFullscreenReq);
}
