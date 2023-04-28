import {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
  refreshAuthData,
} from '@/services/user';
import { getSysConfig } from '@/services/config';
import { getCurrentDate, getSingleStorageSyncData, postMsg } from '@/utils/utils';
import { decrypt } from '@/utils/crypto';
import { SocailStoreVersion } from '@/utils/constants';
import {default as processExReq, clear} from './exData';
const Web3EthAccounts = require('web3-eth-accounts');
console.log('Background initialization')
let fullscreenPort = null;
let web3EthAccount = new Web3EthAccounts();
const padoServices = {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
  getSysConfig,
  refreshAuthData,
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
  fullscreenPort = port;
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
      processExReq(message, port, USERPASSWORD);
      break;
    case 'storage':
      processStorageReq(message, port);
      break;
    case 'wallet':
      processWalletReq(message, port);
      break;
    case 'algorithm':
      processAlgorithmReq(message, port);
      break;
    default:
      break;
  }
};

async function hasOffscreenDocument(path) {
  // Check all windows controlled by the service worker to see if one 
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  console.log(offscreenUrl);
  const matchedClients = await clients.matchAll();
  console.log('matchedClients', matchedClients);
  for (const client of matchedClients) {
    if (client.url === offscreenUrl) {
      return true;
    }
  }
  return false;
}

const processAlgorithmReq = async (message, port) => {
  const matchedClients = await clients.matchAll();
  console.log('matchedClients', matchedClients);

  const { reqMethodName, params = {} } = message;
  switch (reqMethodName) {
    case 'start':
      const offscreenDocumentPath = 'offscreen.html'
      if (!(await hasOffscreenDocument(offscreenDocumentPath))) {
        console.log('create offscreen document...........');
        await chrome.offscreen.createDocument({
          url: chrome.runtime.getURL(offscreenDocumentPath),
          reasons: ['IFRAME_SCRIPTING'],
          justification: 'WORKERS for needing the document',
        });
        console.log('offscreen document created');
      } else {
        console.log('offscreen document has already created');
      }
      break;
    case 'init':
      chrome.runtime.sendMessage({type: 'algorithm', method:'init', params:params});
      break;
    case 'getAttestation':
      chrome.runtime.sendMessage({type: 'algorithm', method:'getAttestation', params:params});
      break;
    case 'getAttestationResult':
      chrome.runtime.sendMessage({type: 'algorithm', method:'getAttestationResult', params:params});
      break;
    case 'stop':
      await chrome.offscreen.closeDocument();
      postMsg(fullscreenPort, { resType: 'algorithm', resMethodName: 'stop', res: {retcode:0} })
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
        postMsg(port,{ resMethodName: reqMethodName, res: result })
      }
      break;
    case 'checkIsLogin':
      if (rc === 0) {
        if (params.data_type === 'LOGIN') {
          await chrome.storage.local.set({ userInfo: JSON.stringify(result) }); // TODO
          postMsg(port,{ resMethodName: reqMethodName, res: true })
        } else if (params.data_type === 'DATASOURCE') {
          const lowerCaseSourceName = params.source.toLowerCase();
          const socialSourceData = {
            ...result,
            date: getCurrentDate(),
            timestamp: + new Date()
          };
          socialSourceData.version = SocailStoreVersion;
          await chrome.storage.local.set({
            [lowerCaseSourceName]: JSON.stringify(socialSourceData),
          }); // TODO
          postMsg(port,{
            resMethodName: reqMethodName,
            res: true,
            params: {
              data_type: params.data_type,
              source: params.source,
              // result: {
              //   [lowerCaseSourceName]: socialSourceData,
              // },
            },
          })
        }
      } else {
        postMsg(port,{ resMethodName: reqMethodName, res: false })
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
        postMsg(port,{ resMethodName: reqMethodName, res: true })
      } else {
        postMsg(port,{ resMethodName: reqMethodName, res: false })
      }
      break;
    case 'getSysConfig':
      if (rc === 0) {
        postMsg(port,{ resMethodName: reqMethodName, res: result })
      }
      break;
    case 'refreshAuthData':
      if (rc === 0) {
        const lowerCaseSourceName = params.source.toLowerCase();
        const socialSourceData = {
          ...result,
          date: getCurrentDate(),
          timestamp: + new Date()
        };
        socialSourceData.version = SocailStoreVersion;
        await chrome.storage.local.set({
          [lowerCaseSourceName]: JSON.stringify(socialSourceData),
        });
        postMsg(port,{
          resMethodName: reqMethodName,
          res: true,
          params: {
            mc,
            source: params.source,
          },
        })
      } else if (rc === 1 && mc === 'UNAUTHORIZED_401') {
        //Token expiration
        postMsg(port,{
          resMethodName: reqMethodName,
          res: false,
          params: {
            mc,
            source: params.source,
          },
        })
      } else {
        postMsg(port,{ resMethodName: reqMethodName, res: false })
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
      // TODO perf fetch from background first
      if(!USERPASSWORD) {
        postMsg(port,{
          resType: 'lock',
        })
      }
      if (key.endsWith('cipher')) {
        const valStr = res[key];
        console.log('Ready to decrypt - storage:', USERPASSWORD, key)
        const val = JSON.parse(decrypt(valStr, USERPASSWORD));
        // const { apiKey, secretKey, passphase } = val
        postMsg(port,{
          resType: 'get',
          key: key,
          value: val,
        })
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
            postMsg(port,{ resMethodName: reqMethodName, res: true })
          } catch {
            postMsg(port,{ resMethodName: reqMethodName, res: false })
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
      clear();
      web3EthAccount = null;
      break;
    case 'queryUserPassword':
      postMsg(port,{ resMethodName: reqMethodName, res: !!USERPASSWORD })
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
        postMsg(port,{ resMethodName: reqMethodName, res: acc.address })
      } catch {
        postMsg(port,{ resMethodName: reqMethodName, res: '' })
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
  fullscreenPort = null;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('background onMessage message', message);
  if (message.resType === 'algorithm' && fullscreenPort) {
      postMsg(fullscreenPort,message)
  }
});
