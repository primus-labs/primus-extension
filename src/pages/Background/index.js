import { sendInitAttestationRes } from './utils/msgTransfer.js';
import { eventReport } from '@/services/api/usertracker';
import {
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
} from '@/config/constants';
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
import { listener as xEventMsgListener } from './xEvent/index.js';
import {
  clearSdkAttestationPreset,
  clearSdkAttestationSession,
  getSdkAttestationSession,
} from './padoZKAttestationJSSDK/sessionStorage.js';

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
    await safeStorageRemove([
      SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
      SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
      'activeRequestAttestation',
    ]);
    await clearSdkAttestationSession();
    await clearSdkAttestationPreset();
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
      const session = await getSdkAttestationSession();
      if (session?.sdkVersion) {
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
      const session = await getSdkAttestationSession();
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'init',
        params: {
          errLogUrl: 'wss://api.padolabs.org/logs',
          clientType: session?.clientType || '',
        },
      });
      break;
    }
    case 'getAttestation':
      break;
    case 'getAttestationResult': {
      const session = await getSdkAttestationSession();
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestationResult',
        params: { ...params, clientType: session?.clientType || '' },
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
        SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
        SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
        'activeRequestAttestation',
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
  if (message.type === 'xEvent') {
    xEventMsgListener(message, sender);
    return;
  }
  if (message.type === 'xPage') {
    xEventMsgListener(message, sender);
    return;
  }
  const routeKey = message.resType === 'algorithm' ? 'algorithm' : message.type;
  const handler = messageRoutes[routeKey];
  if (handler) {
    handler(message, sender, sendResponse);
    return true;
  }
});
