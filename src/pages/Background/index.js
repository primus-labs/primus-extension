import {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
  refreshAuthData,
  getUserIdentity,
} from '@/services/api/user';
import { getSysConfig, getProofTypes } from '@/services/api/config';
import { requestSignTypedData } from '@/services/wallets/utils';

import {
  getCurrentDate,
  postMsg,
  sub,
  compareVersions,
  getAccount,
  strToHexSha256,
} from '@/utils/utils';

import {
  SocailStoreVersion,
  padoExtensionVersion,
  ATTESTATIONPOLLINGTIMEOUT,
} from '@/config/constants';
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
import { dataSourceWebMsgListener } from './dataSourceWeb.js';
import { padoZKAttestationJSSDKMsgListener } from './padoZKAttestationJSSDK/index.js';
import { algorithmMsgListener } from './algorithm.js';
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
// const compareRes = compareVersions('0.3.14', padoExtensionVersion);
// console.log('padoExtensionVersion', padoExtensionVersion, compareRes);
let USERPASSWORD = '';
const creatUserInfo = async () => {
  const { userInfo } = await chrome.storage.local.get(['userInfo']);
  if (!userInfo) {
    let web3EthAccount = new Web3EthAccounts();
    let { privateKey, address } = web3EthAccount.create();
    await chrome.storage.local.set({
      privateKey,
      padoCreatedWalletAddress: address,
    });
    const privateKeyStr = privateKey?.substr(2);
    const timestamp = +new Date() + '';
    try {
      const signature = await requestSignTypedData(
        privateKeyStr,
        address,
        timestamp
      );
      const res = await getUserIdentity({
        signature,
        timestamp,
        address,
      });
      const { rc, result } = res;
      if (rc === 0) {
        const { bearerToken, identifier } = result;
        await chrome.storage.local.set({
          userInfo: JSON.stringify({
            id: identifier,
            token: bearerToken,
          }),
        });
      }
    } catch (e) {
      console.log('getUserIdentity error', e);
    }
  }
};
chrome.runtime.onInstalled.addListener(async ({ reason, version }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // showIndex();
    creatUserInfo();
    const eventInfo = {
      eventType: 'EXTENSION_INSTALL',
      rawData: '',
    };
    eventReport(eventInfo);
  } else if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
    await chrome.storage.local.remove(['activeRequestAttestation']);
    console.log('333-bg-update');
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
      const hasFlag = await hasOffscreenDocument(offscreenDocumentPath);
      const { padoZKAttestationJSSDKBeginAttest: isFromSDK } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
      console.log(
        'debugSDK-1-2-bg-start',
        new Date().toLocaleString(),
        'hasOffscreenDocument:',
        hasFlag,
        'isFromSDK:',
        isFromSDK
      );
      if (!hasFlag) {
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
        const {
          padoZKAttestationJSSDKBeginAttest,
          padoZKAttestationJSSDKDappTabId: dappTabId,
          webProofTypes,
        } = await chrome.storage.local.get([
          'padoZKAttestationJSSDKBeginAttest',
          'padoZKAttestationJSSDKDappTabId',
          'webProofTypes',
        ]);
        if (padoZKAttestationJSSDKBeginAttest === '1') {
          const attestationTypeIdList = (
            webProofTypes ? JSON.parse(webProofTypes) : []
          ).map((i) => {
            return {
              text: i.description,
              value: i.id,
            };
          });
          chrome.tabs.query({}, function (tabs) {
            console.log(
              'debugSDK-2-bg-response-sdk-initAttestationRes',
              new Date().toLocaleString(),
              'dappId:',
              dappTabId,
              tabs
            );
          });
          
          chrome.tabs.sendMessage(dappTabId, {
            type: 'padoZKAttestationJSSDK',
            name: 'initAttestationRes',
            params: {
              result: true,
              data: {
                attestationTypeIdList,
                padoExtensionVersion,
              },
            },
          });
        }
        console.log(
          `${new Date().toLocaleString()} offscreen document has already created`
        );
      }
      break;
    case 'init':
      console.log('debugSDK-1-3-bg-init', new Date().toLocaleString());
      var eventInfo = {
        eventType: 'ATTESTATION_INIT_3',
        rawData: {},
      };
      eventReport(eventInfo);
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
      const { padoZKAttestationJSSDKBeginAttest } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
      const f = { ...attestationParams };
      await chrome.storage.local.set({
        activeRequestAttestation: JSON.stringify(f),
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
        timestamp: + new Date()
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
      const stopFn = async () => {
        console.log('333-bg-stop', params);
        await chrome.offscreen.closeDocument();
        await chrome.storage.local.remove(['activeRequestAttestation']);
        fullscreenPort &&
          postMsg(fullscreenPort, {
            resType: 'algorithm',
            resMethodName: 'stop',
            res: { retcode: 0 },
            params,
          });
      };
      if (params?.from === 'beforeunload') {
        const { padoZKAttestationJSSDKBeginAttest } =
          await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
        if (padoZKAttestationJSSDKBeginAttest !== '1') {
          await stopFn();
        }
      } else {
        await stopFn();
      }
      break;
    case 'lineaEventStartOffline':
      fullscreenPort &&
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
          let storageRes = await chrome.storage.local.get(lowerCaseSourceName);
          const lastData = storageRes[lowerCaseSourceName];
          let pnl = null;
          if (lastData) {
            const lastTotalBal = JSON.parse(lastData).followers;
            pnl = sub(dataInfo.followers, lastTotalBal).toFixed();
          }
          if (pnl !== null && pnl !== undefined) {
            dataInfo.pnl = pnl;
          }

          const socialSourceData = {
            ...dataInfo,
            date: getCurrentDate(),
            timestamp: +new Date(),
            version: SocailStoreVersion,
          };
          socialSourceData.userInfo = {};
          socialSourceData.userInfo.userName = socialSourceData.userName;
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

          let storageRes = await chrome.storage.local.get(lowerCaseSourceName);
          const lastData = storageRes[lowerCaseSourceName];
          let pnl = null;
          if (lastData) {
            const lastTotalBal = JSON.parse(lastData).followers;
            pnl = sub(dataInfo.followers, lastTotalBal).toFixed();
          }
          if (pnl !== null && pnl !== undefined) {
            dataInfo.pnl = pnl;
          }

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

const processWalletReq = async (message, port) => {
  console.log('processWalletReq message', message);
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
          await chrome.storage.local.set({ privateKey: acc.privateKey });
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

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('background onMessage message', message, fullscreenPort);
  const { resType, type, name, params } = message;
  if (resType === 'algorithm') {
    algorithmMsgListener(
      message,
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort,
      processAlgorithmReq
    );
  }
  if (resType === 'report') {
    if (name === `offscreenReceiveGetAttestation`) {
      var eventInfo = {
        eventType: 'ATTESTATION_START_OFFSCREEN',
        rawData: {
          ...params,
        },
      };
      const {
        padoZKAttestationJSSDKBeginAttest,
        padoZKAttestationJSSDKAttestationPresetParams,
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKBeginAttest',
        'padoZKAttestationJSSDKAttestationPresetParams',
      ]);
      if (padoZKAttestationJSSDKBeginAttest === '1') {
        eventInfo.rawData.attestOrigin =
          padoZKAttestationJSSDKAttestationPresetParams
            ? JSON.parse(padoZKAttestationJSSDKAttestationPresetParams)
                .attestOrigin
            : '';
      }
      eventReport(eventInfo);
    }
  }
  let hasGetTwitterScreenName = false;
  if (type === 'pageDecode') {
    pageDecodeMsgListener(
      message,
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort,
      hasGetTwitterScreenName,
      processAlgorithmReq
    );
  }
  if (type === 'padoWebsite') {
    PadoWebsiteMsgListener(message, sender, sendResponse);
  }
  if (type === 'xFollow') {
    const { name } = message;
    if (name === 'follow') {
    }
  }
  if (type === 'googleAuth') {
    const { name } = message;
    if (name === 'cancelAttest') {
      chrome.runtime.sendMessage(message);
    }
  }
  if (type === 'dataSourceWeb') {
    dataSourceWebMsgListener(
      message,
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort
    );
  }
  if (type === 'padoZKAttestationJSSDK') {
    padoZKAttestationJSSDKMsgListener(
      message,
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort,
      processAlgorithmReq
    );
  }
});
