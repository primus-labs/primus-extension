import {
  getUserIdentity,
} from '@/services/api/user';
import { requestSignTypedData } from '@/services/wallets/utils';

import { sendInitAttestationRes } from './utils/msgTransfer.js';

import { eventReport } from '@/services/api/usertracker';
import './pageDecode/index.js';
import { pageDecodeMsgListener } from './pageDecode/index.js';
import { padoZKAttestationJSSDKMsgListener } from './padoZKAttestationJSSDK/index.js';
import { algorithmMsgListener } from './algorithm.js';
import { devconsoleMsgListener } from './devconsole/index.js';
const Web3EthAccounts = require('web3-eth-accounts');
console.log('Background initialization');

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
    creatUserInfo();
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

const processAlgorithmReq = async (message) => {
  const matchedClients = await clients.matchAll();
  console.log('matchedClients', matchedClients);
  let { reqMethodName, params = {} } = message;
  console.log(
    `${new Date().toLocaleString()} processAlgorithmReq reqMethodName ${reqMethodName}`
  );
  const startFn = async () => {
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
      console.log(`${new Date().toLocaleString()} offscreen document created`);
    } else {
      const {
        padoZKAttestationJSSDKBeginAttest
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKBeginAttest'
      ]);

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
      startFn();
      break;
    case 'init':
      // var eventInfo = {
      //   eventType: 'ATTESTATION_INIT_3',
      //   rawData: {},
      // };
      // eventReport(eventInfo);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'init',
        params: {
          errLogUrl: 'wss://api.padolabs.org/logs',
        },
      });
      break;
    case 'getAttestation':
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
      const stopFn = async () => {
        await chrome.offscreen.closeDocument();
        await chrome.storage.local.remove(['activeRequestAttestation']);
        if (!params?.noRestart) {
          await startFn();
        }
      };
      await stopFn();
      break;
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
  let hasGetTwitterScreenName = false;
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
