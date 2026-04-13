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
  safeStorageRemove,
} from '@/utils/safeStorage';
import { setupKeepAliveListener } from './utils/keepAlive.js';
import { ensureExtensionUserIdentity } from './identityBootstrap.js';

setupKeepAliveListener();

console.log('Background initialization');
chrome.runtime.onInstalled.addListener(async ({ reason, version: _version }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // showIndex();
    ensureExtensionUserIdentity();
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
    await ensureExtensionUserIdentity();
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
