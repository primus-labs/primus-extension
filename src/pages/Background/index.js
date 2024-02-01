import {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
  refreshAuthData,
} from '@/services/api/user';
import { getSysConfig, getProofTypes } from '@/services/api/config';
import { getCurrentDate, postMsg } from '@/utils/utils';
import { SocailStoreVersion } from '@/config/constants';
import {
  default as processExReq,
  clear,
  assembleAlgorithmParams,
  resetExchangesCipher,
  EXCHANGEINFO,
} from './exData';
import { eventReport } from '@/services/api/usertracker';
import './pageDecode.js';
import { pageDecodeMsgListener } from './pageDecode.js';
import { PadoWebsiteMsgListener } from './pageWebsite.js';
import { icpMsgListener } from './icp.js';
const Web3EthAccounts = require('web3-eth-accounts');
console.log('Background initialization');
let fullscreenPort = null;
let web3EthAccount = new Web3EthAccounts();
const padoServices = {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
  getSysConfig,
  refreshAuthData,
  getProofTypes,
};

let USERPASSWORD = '';
chrome.runtime.onInstalled.addListener(({ reason, version }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    showIndex();

    const eventInfo = {
      eventType: 'EXTENSION_INSTALL',
      rawData: '',
    };
    eventReport(eventInfo);
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
  fullscreenPort = port;
  if (port.name.startsWith('fullscreen')) {
    console.log('fullscreen connectted port=', port);
    port.onMessage.addListener(processFullscreenReq);
    port.onDisconnect.addListener(onDisconnectFullScreen);
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
  let { reqMethodName, params = {} } = message;
  console.log(
    `${new Date().toLocaleString()} processAlgorithmReq reqMethodName ${reqMethodName}`
  );
  switch (reqMethodName) {
    case 'start':
      const offscreenDocumentPath = 'offscreen.html';
      if (!(await hasOffscreenDocument(offscreenDocumentPath))) {
        console.log(
          `${new Date().toLocaleString()} create offscreen document...........`
        );
        await chrome.offscreen.createDocument({
          url: chrome.runtime.getURL(offscreenDocumentPath),
          reasons: ['IFRAME_SCRIPTING'],
          justification: 'WORKERS for needing the document',
        });
        console.log(
          `${new Date().toLocaleString()} offscreen document created`
        );
      } else {
        console.log(
          `${new Date().toLocaleString()} offscreen document has already created`
        );
      }
      break;
    case 'init':
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'init',
        params: params,
      });
      break;
    case 'getAttestation':
      const attestationParams = await assembleAlgorithmParams(
        params,
        USERPASSWORD,
        port
      );

      await chrome.storage.local.set({
        activeRequestAttestation: JSON.stringify(attestationParams),
      });

      if (
        attestationParams.source === 'binance' &&
        process.env.NODE_ENV === 'production'
      ) {
        attestationParams.proxyUrl = 'wss://api.padolabs.org/algoproxy';
      }

      console.log('attestationParams=', attestationParams);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: attestationParams,
        exInfo: EXCHANGEINFO,
      });
      break;
    case 'getAttestationResult':
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestationResult',
        params: params,
      });
      break;
    case 'startOffline':
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'startOffline',
        params: params,
      });
      break;
    case 'stop':
      await chrome.offscreen.closeDocument();
      postMsg(fullscreenPort, {
        resType: 'algorithm',
        resMethodName: 'stop',
        res: { retcode: 0 },
        params,
      });
      break;
    case 'lineaEventStartOffline':
      postMsg(fullscreenPort, {
        resType: 'algorithm',
        resMethodName: 'lineaEventStartOffline',
        res: {},
      });
      break;
    default:
      break;
  }
};

const processpadoServiceReq = async (message, port) => {
  const { reqMethodName, params = {}, config = {} } = message;
  const formatParams = { ...params };
  delete formatParams.password;
  try {
    let rc, result, mc;
    if (reqMethodName !== 'bindUserAddress') {
      const fetchRes = await padoServices[reqMethodName](
        { ...formatParams },
        {
          ...config,
        }
      );
      rc = fetchRes.rc;
      result = fetchRes.result;
      mc = fetchRes.mc;
    }
    switch (reqMethodName) {
      case 'getAllOAuthSources':
        if (rc === 0) {
          postMsg(port, { resMethodName: reqMethodName, res: result });
        } else {
          postMsg(port, { resMethodName: reqMethodName, res: false });
        }
        break;
      case 'checkIsLogin':
        if (rc === 0) {
          const { dataInfo, userInfo } = result;
          const lowerCaseSourceName = params.source.toLowerCase();
          const socialSourceData = {
            ...dataInfo,
            date: getCurrentDate(),
            timestamp: +new Date(),
            version: SocailStoreVersion,
          };
          await chrome.storage.local.set({
            [lowerCaseSourceName]: JSON.stringify(socialSourceData),
          });
          postMsg(port, {
            resMethodName: reqMethodName,
            res: true,
            params: {
              source: params.source,
            },
          });
        } else {
          postMsg(port, { resMethodName: reqMethodName, res: false });
        }
        break;
      case 'bindUserAddress':
        try {
          const msg = {
            fullScreenType: 'wallet',
            reqMethodName: 'encrypt',
            params: {
              password: params.password,
            },
          };
          await processWalletReq(msg, port);
          postMsg(port, { resMethodName: reqMethodName, res: true });
        } catch {
          postMsg(port, { resMethodName: reqMethodName, res: false });
        }
        break;
      case 'getSysConfig':
        if (rc === 0) {
          postMsg(port, { resMethodName: reqMethodName, res: result });
        } else {
          postMsg(port, { resMethodName: reqMethodName, res: false });
        }
        break;
      case 'refreshAuthData':
        if (rc === 0) {
          const lowerCaseSourceName = params.source.toLowerCase();
          const { dataInfo, userInfo } = result;
          const socialSourceData = {
            ...dataInfo,
            date: getCurrentDate(),
            timestamp: +new Date(),
            version: SocailStoreVersion,
          };
          await chrome.storage.local.set({
            [lowerCaseSourceName]: JSON.stringify(socialSourceData),
          });
          postMsg(port, {
            resMethodName: reqMethodName,
            res: true,
            params: {
              mc,
              source: params.source,
            },
          });
        } else if (rc === 1 && mc === 'UNAUTHORIZED_401') {
          //Token expiration
          postMsg(port, {
            resMethodName: reqMethodName,
            res: false,
            params: {
              mc,
              source: params.source,
            },
          });
        } else {
          postMsg(port, { resMethodName: reqMethodName, res: false });
        }
        break;
      case 'getProofTypes':
        if (rc === 0) {
          postMsg(port, { resMethodName: reqMethodName, res: result });
        } else {
          postMsg(port, { resMethodName: reqMethodName, res: false });
        }
        break;
      default:
        break;
    }
  } catch (e) {
    console.log('processpadoServiceReq error:', reqMethodName);
    throw new Error(e);
  }
};

const processStorageReq = async (message, port) => {
  // console.log('processStorageReq message', message);
  const { type, key, value } = message;
  switch (type) {
    case 'set':
      await chrome.storage.local.set({ [key]: value });
      break;
    case 'remove':
      await chrome.storage.local.remove(key);
      break;
    default:
      break;
  }
};

const processWalletReq = async (message, port) => {
  // console.log('processWalletReq message', message);
  const {
    reqMethodName,
    params: { password },
  } = message;
  let transferMsg;
  const { keyStore } = await chrome.storage.local.get(['keyStore']);
  switch (reqMethodName) {
    case 'decrypt':
      if (keyStore) {
        try {
          web3EthAccount = new Web3EthAccounts();
          const pwd = password || USERPASSWORD;
          const plaintextKeyStore = web3EthAccount.decrypt(keyStore, pwd);
          USERPASSWORD = pwd;
          postMsg(port, {
            resMethodName: reqMethodName,
            res: plaintextKeyStore,
          });
        } catch {
          postMsg(port, { resMethodName: reqMethodName, res: false });
        }
      } else {
        postMsg(port, { resMethodName: reqMethodName, res: false });
      }
      break;
    case 'encrypt':
      const pKRes = await chrome.storage.local.get(['privateKey']);
      let privateKey = pKRes.privateKey;
      web3EthAccount = web3EthAccount || new Web3EthAccounts();
      const orignAccount = web3EthAccount.privateKeyToAccount(privateKey);
      const encryptAccount = orignAccount.encrypt(password);
      USERPASSWORD = password;
      await chrome.storage.local.set({
        keyStore: JSON.stringify(encryptAccount),
      });

      await chrome.storage.local.remove([
        'privateKey',
        'padoCreatedWalletAddress',
      ]);
      break;
    case 'clearUserPassword':
      USERPASSWORD = '';
      clear();
      web3EthAccount = null;
      break;
    case 'queryUserPassword':
      // console.log('background receive queryUserPassword');
      postMsg(port, { resMethodName: reqMethodName, res: USERPASSWORD });
      break;
    case 'resetUserPassword':
      console.log('background receive resetUserPassword');
      USERPASSWORD = password;
      break;
    case 'create':
      try {
        const pKRes = await chrome.storage.local.get(['privateKey']);
        let privateKey = pKRes.privateKey;
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
        postMsg(port, { resMethodName: reqMethodName, res: acc.address });
      } catch {
        postMsg(port, { resMethodName: reqMethodName, res: '' });
      }
      break;
    case 'resetPassword':
      // decrypt by old password
      if (USERPASSWORD) {
        try {
          if (keyStore) {
            web3EthAccount = new Web3EthAccounts();
            const { privateKey } = web3EthAccount.decrypt(
              keyStore,
              USERPASSWORD
            );
            if (privateKey) {
              // encrypt by new password
              const orignAccount =
                web3EthAccount.privateKeyToAccount(privateKey);
              const encryptAccount = orignAccount.encrypt(password);

              await chrome.storage.local.set({
                keyStore: JSON.stringify(encryptAccount),
              });
            }
          }
          await resetExchangesCipher(USERPASSWORD, password);
          USERPASSWORD = password;
          postMsg(port, { resMethodName: reqMethodName, res: true });
        } catch {
          postMsg(port, { resMethodName: reqMethodName, res: false });
        }
      }
      // refresh exchange cipher
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
  console.log('background onMessage message', message, fullscreenPort);
  if (message.resType === 'algorithm' && fullscreenPort) {
    postMsg(fullscreenPort, message);
  }
  if (message.type === 'pageDecode') {
    pageDecodeMsgListener(
      message,
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort
    );
  }
  if (message.type === 'padoWebsite') {
    PadoWebsiteMsgListener(message, sender, sendResponse);
  }
  if (message.type === 'xFollow') {
  }
  if (message.type === 'googleAuth') {
    const { name } = message;
    if (name === 'cancelAttest') {
      chrome.runtime.sendMessage(message);
    }
  }
  if (message.type === 'icp') {
    icpMsgListener(message, sender, sendResponse, USERPASSWORD, fullscreenPort);
  }
});
