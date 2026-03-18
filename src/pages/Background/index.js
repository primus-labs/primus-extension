import {
  getUserIdentity,
} from '@/services/api/user';
import { requestSignTypedData } from '@/services/wallets/utils';
import { sendInitAttestationRes } from './utils/msgTransfer.js';
import { eventReport } from '@/services/api/usertracker';
import {
  createOffscreenDoc,
  closeOffscreenDoc,
  hasOffscreenDocument,
} from './offscreenManager.js';
import './pageDecode/index.js';
import { pageDecodeMsgListener } from './pageDecode/index.js';
import { padoZKAttestationJSSDKMsgListener } from './padoZKAttestationJSSDK/index.js';
import { algorithmMsgListener } from './algorithm/index.js';
import { devconsoleMsgListener } from './devconsole/index.js';
import {
  safeStorageGet,
  safeStorageSet,
  safeStorageRemove,
} from '@/utils/safeStorage';
import { setupKeepAliveListener } from './utils/keepAlive.js';
import Web3EthAccounts from 'web3-eth-accounts';

setupKeepAliveListener();

console.log('Background initialization');

const createUserInfo = async () => {
  const { userInfo } = await safeStorageGet(['userInfo']);
  if (!userInfo) {
    let web3EthAccount = new Web3EthAccounts();
    let { privateKey, address } = web3EthAccount.create();
    await safeStorageSet({
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
      console.log('getUserIdentity', res);
      const { rc, result } = res;
      if (rc === 0) {
        const { bearerToken, identifier } = result;
        await safeStorageSet({
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
chrome.runtime.onInstalled.addListener(async ({ reason, version: _version }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // showIndex();
    createUserInfo();
    const eventInfo = {
      eventType: 'EXTENSION_INSTALL',
      rawData: '',
    };
    eventReport(eventInfo);
    processAlgorithmReq({
      reqMethodName: 'start',
    });
  } else if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
    await safeStorageRemove(['activeRequestAttestation']);
  }
});

const processAlgorithmReq = async (message) => {
  const { reqMethodName, params = {} } = message;
  console.log(
    `${new Date().toLocaleString()} processAlgorithmReq reqMethodName ${reqMethodName}`
  );

  const startFn = async () => {
    if (!(await hasOffscreenDocument())) {
      console.log(
        `${new Date().toLocaleString()} create offscreen document...........`
      );
      await createOffscreenDoc();
      console.log(`${new Date().toLocaleString()} offscreen document created`);
    } else {
      const { padoZKAttestationJSSDKBeginAttest } =
        await safeStorageGet(['padoZKAttestationJSSDKBeginAttest']);
      if (padoZKAttestationJSSDKBeginAttest) {
        await sendInitAttestationRes();
      }
      console.log(
        `${new Date().toLocaleString()} offscreen document has already created`
      );
    }
  };

  switch (reqMethodName) {
    case 'start':
      await startFn();
      break;
    case 'init': {
      const { padoZKAttestationJSSDKClientType: clientType } =
        await safeStorageGet(['padoZKAttestationJSSDKClientType']);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'init',
        params: {
          errLogUrl: 'wss://api.padolabs.org/logs',
          clientType: clientType || '',
        },
      });
      break;
    }
    case 'getAttestation':
      break;
    case 'getAttestationResult': {
      const { padoZKAttestationJSSDKClientType: clientType } =
        await safeStorageGet(['padoZKAttestationJSSDKClientType']);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestationResult',
        params: { ...params, clientType: clientType || '' },
      });
      break;
    }
    case 'startOffline':
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'startOffline',
        params,
      });
      break;
    case 'stop': {
      await closeOffscreenDoc();
      await safeStorageRemove([
        'activeRequestAttestation',
        'padoZKAttestationJSSDKClientType',
      ]);
      if (!params?.noRestart) {
        await startFn();
      }
      break;
    }
    default:
      break;
  }
};

const messageRoutes = {
  algorithm: (msg, sender, res) =>
    algorithmMsgListener(msg, sender, res, processAlgorithmReq),
  pageDecode: (msg, sender, res) =>
    pageDecodeMsgListener(msg, sender, res, false, processAlgorithmReq),
  padoZKAttestationJSSDK: (msg, sender, res) =>
    padoZKAttestationJSSDKMsgListener(msg, sender, res, processAlgorithmReq),
  devconsole: (msg, sender, res) =>
    devconsoleMsgListener(msg, sender, res),
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('background onMessage message', message);
  const routeKey = message.resType === 'algorithm' ? 'algorithm' : message.type;
  const handler = messageRoutes[routeKey];
  if (handler) {
    handler(message, sender, sendResponse);
    return true;
  }
});
