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

const Web3EthAccounts = require('web3-eth-accounts');

console.log('Background initialization');

const createUserInfo = async () => {
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
      console.log('getUserIdentity', res);
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
    await chrome.storage.local.remove(['activeRequestAttestation']);
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
        await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
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
    case 'init':
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'init',
        params: { errLogUrl: 'wss://api.padolabs.org/logs' },
      });
      break;
    case 'getAttestation':
      break;
    case 'getAttestationResult':
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestationResult',
        params,
      });
      break;
    case 'startOffline':
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'startOffline',
        params,
      });
      break;
    case 'stop': {
      await closeOffscreenDoc();
      await chrome.storage.local.remove(['activeRequestAttestation']);
      if (!params?.noRestart) {
        await startFn();
      }
      break;
    }
    default:
      break;
  }
};

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('background onMessage message', message);
  const { resType, type } = message;
  if (resType === 'algorithm') {
    algorithmMsgListener(message, sender, sendResponse, processAlgorithmReq);
  }
  const hasGetTwitterScreenName = false;
  if (type === 'pageDecode') {
    pageDecodeMsgListener(
      message,
      sender,
      sendResponse,
      hasGetTwitterScreenName,
      processAlgorithmReq
    );
  }
  if (type === 'padoZKAttestationJSSDK') {
    padoZKAttestationJSSDKMsgListener(
      message,
      sender,
      sendResponse,
      processAlgorithmReq
    );
  }
  if (type === 'devconsole') {
    devconsoleMsgListener(message, sender, sendResponse);
  }
});
