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
import './pageDecode/index.js';
import { pageDecodeMsgListener } from './pageDecode/index.js';
import { PadoWebsiteMsgListener } from './pageWebsite.js';
import { dataSourceWebMsgListener } from './dataSourceWeb.js';
import { padoZKAttestationJSSDKMsgListener } from './padoZKAttestationJSSDK/index.js';
import { algorithmMsgListener } from './algorithm.js';
import { devconsoleMsgListener } from './devconsole/index.js';
import { listener as lumaMonadEventMsgListener } from './lumaMonadEvent/index.js';
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
    processAlgorithmReq({
      reqMethodName: 'start',
    });
  } else if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
    await chrome.storage.local.remove(['activeRequestAttestation']);
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
        padoZKAttestationJSSDKBeginAttest,
        padoZKAttestationJSSDKDappTabId: dappTabId,
        webProofTypes,
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKBeginAttest',
        'padoZKAttestationJSSDKDappTabId',
        'webProofTypes',
      ]);

      if (padoZKAttestationJSSDKBeginAttest) {
        const attestationTypeIdList = (
          webProofTypes ? JSON.parse(webProofTypes) : []
        ).map((i) => {
          return {
            text: i.description,
            value: i.id,
          };
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
  };
  switch (reqMethodName) {
    case 'start':
      startFn();
      break;
    case 'init':
      var eventInfo = {
        eventType: 'ATTESTATION_INIT_3',
        rawData: {},
      };
      eventReport(eventInfo);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'init',
        params: {
          errLogUrl: 'wss://api.padolabs.org/logs',
        },
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
        if (fullscreenPort) {
          postMsg(fullscreenPort, {
            resType: 'algorithm',
            resMethodName: 'stop',
            res: { retcode: 0 },
            params,
          });
        } else {
          if (!params?.noRestart) {
            await startFn();
          }
        }
      };
      if (params?.from === 'beforeunload') {
        const { padoZKAttestationJSSDKBeginAttest } =
          await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
        if (!padoZKAttestationJSSDKBeginAttest) {
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
      if (padoZKAttestationJSSDKBeginAttest) {
        const prestParamsObj = JSON.parse(
          padoZKAttestationJSSDKAttestationPresetParams
        );
        const formatOrigin =
          padoZKAttestationJSSDKBeginAttest === '1'
            ? prestParamsObj.attestOrigin
            : prestParamsObj.appId;

        eventInfo.rawData.attestOrigin = formatOrigin;
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
      lumaMonadEventMsgListener(message, sender);
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
  if (type === 'devconsole') {
    devconsoleMsgListener(
      message,
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort
    );
  }
  if (type === 'lumaMonadEvent') {
    console.log('content2', message);
    lumaMonadEventMsgListener(message, sender);
  }
  
  // Handler for following a user on Xiaohongshu
  if (type === 'follow_xiaohongshu_user' || type === 'xiaohongshu_follow') {
    console.log('Received follow request for Xiaohongshu user:', message.data.handle);
    
    // We need to make sure we return true to keep the message channel open
    // for our async operation
    (async () => {
      let searchTab = null;
      try {
        const { handle, userId } = message.data;
        console.log(`Attempting to follow Xiaohongshu user: ${handle}`);
        
        // Try to get userId from storage before creating tab
        const userIdFromStorage = await new Promise(resolve => {
          chrome.storage.local.get(['xiaohongshuUserIdMappings'], (result) => {
            const mappings = result.xiaohongshuUserIdMappings || {};
            console.log('Retrieved userId mappings from storage:', mappings);
            
            if (mappings[handle]) {
              console.log(`Found stored userId ${mappings[handle]} for handle ${handle}`);
              resolve(mappings[handle]);
            } else {
              resolve(null);
            }
          });
        });
        
        // Determine the best profile URL to use
        let profileUrl;
        const targetId = userIdFromStorage || handle;
        
        profileUrl = `https://www.xiaohongshu.com/user/profile/${targetId}`;
        console.log(`Navigating directly to profile URL: ${profileUrl}`);
        
        // Option 1: Try with a background tab first
        try {
          searchTab = await chrome.tabs.create({ 
            url: profileUrl, 
            active: false  // Set to false to open the tab in the background
          });
          
          console.log('Created tab with ID:', searchTab.id);
          
          // Wait for the page to load
          await new Promise(resolve => setTimeout(resolve, 5000)); // Longer wait time
          
          // Execute script to check if we're on a profile page and find the follow button
          console.log('Checking if we reached the profile page...');
          const profilePageResult = await chrome.scripting.executeScript({
            target: { tabId: searchTab.id },
            func: async (userHandle) => {
              const debugInfo = {
                logs: [],
                elements: {},
                actions: []
              };
              
              const log = (message) => {
                console.log(`[Xiaohongshu Direct] ${message}`);
                debugInfo.logs.push(message);
              };
              
              const wait = ms => new Promise(r => setTimeout(r, ms));
              
              try {
                // Check if we're on a profile page
                log('Checking if on a profile page');
                const profileElements = document.querySelectorAll('[class*="profile"], [class*="user"], [id*="profile"], [id*="user"]');
                debugInfo.foundProfileElements = profileElements.length;
                
                // Check if the follow button exists on the current page
                const followButtonExact = document.querySelector('button.reds-button-new.follow-button.large.primary.follow-button');
                const followButtonGeneric = document.querySelector('.follow-button');
                const followButtonByText = Array.from(document.querySelectorAll('button')).find(btn => 
                  btn.textContent.includes('关注'));
                
                // Button inside specific divs as shown in the HTML structure
                const followButtonInDiv = document.querySelector('.btn button.follow-button');
                
                // Check for "no results" or "user not found" indicators
                const noResultsContainer = document.querySelector('.no-result-container') || 
                                         document.querySelector('[class*="no-result"]');
                
                const noDataContainer = document.querySelector('.no-data-container') || 
                                      document.querySelector('[class*="no-data"]');
                
                // Elements that might indicate empty search results or no such user
                const emptyState = document.querySelector('[class*="empty-state"]');
                
                debugInfo.elements.errorIndicators = {
                  noResultsContainer: !!noResultsContainer,
                  noDataContainer: !!noDataContainer,
                  emptyState: !!emptyState
                };
                
                // If we find a clear indication of "no results" or "user not found"
                if (noResultsContainer || noDataContainer || emptyState) {
                  log('Found indicators that user does not exist');
                  
                  // Get text content from these elements for error details
                  const errorTexts = [];
                  if (noResultsContainer) errorTexts.push(noResultsContainer.textContent.trim());
                  if (noDataContainer) errorTexts.push(noDataContainer.textContent.trim());
                  if (emptyState) errorTexts.push(emptyState.textContent.trim());
                  
                  debugInfo.errorTexts = errorTexts;
                  
                  return { 
                    success: false, 
                    userNotFound: true,
                    error: 'User does not exist on Xiaohongshu',
                    debugInfo
                  };
                }
                
                debugInfo.elements.followButton = {
                  exactSelector: !!followButtonExact,
                  genericSelector: !!followButtonGeneric,
                  byText: !!followButtonByText,
                  inDiv: !!followButtonInDiv,
                };
                
                if (followButtonExact || followButtonGeneric || followButtonByText || followButtonInDiv) {
                  log('Found follow button directly on current page');
                  // We're already on a page with the follow button, proceed to clicking it
                  const buttonToClick = followButtonExact || followButtonInDiv || followButtonGeneric || followButtonByText;
                  debugInfo.elements.buttonToClick = {
                    tagName: buttonToClick.tagName,
                    className: buttonToClick.className,
                    innerText: buttonToClick.innerText,
                    innerHTML: buttonToClick.innerHTML.substring(0, 100)
                  };
                  
                  // Check if the button indicates we're already following this user
                  const buttonText = buttonToClick.textContent || buttonToClick.innerText;
                  const isOutlinedButton = buttonToClick.classList.contains('outlined') || 
                                         buttonToClick.className.includes('outlined');
                  
                  if (buttonText.includes('已关注') || (isOutlinedButton && buttonText.includes('关注'))) {
                    log('User is already being followed - no need to click');
                    return { 
                      success: true,
                      alreadyFollowing: true,
                      followSuccess: true, // Consider already following as success
                      directFollow: true,
                      debugInfo
                    };
                  }
                  
                  log('Clicking the found follow button');
                  buttonToClick.click();
                  debugInfo.actions.push('Clicked follow button');
                  
                  // Wait for button state to change
                  await wait(2000);
                  
                  // Verify if the action was successful - check for 已关注 text
                  const buttonAfterClick = document.querySelector('button.follow-button') || 
                                         document.querySelector('[class*="follow-button"]');
                  
                  const successTexts = ['已关注', 'Following', 'Followed'];
                  let isSuccessful = false;
                  
                  if (buttonAfterClick) {
                    const buttonTextAfter = buttonAfterClick.textContent || buttonAfterClick.innerText;
                    log(`Button text after click: ${buttonTextAfter}`);
                    isSuccessful = successTexts.some(text => buttonTextAfter.includes(text));
                    
                    // Also check for class changes
                    const hasSuccessClass = buttonAfterClick.classList.contains('outlined') || 
                                          buttonAfterClick.classList.contains('followed') ||
                                          buttonAfterClick.className.includes('outlined') ||
                                          buttonAfterClick.className.includes('followed');
                    
                    isSuccessful = isSuccessful || hasSuccessClass;
                  }
                  
                  log(isSuccessful ? 'Follow was successful' : 'Follow appears to have failed');
                  
                  return { 
                    success: isSuccessful, 
                    followSuccess: isSuccessful,
                    directFollow: true,
                    debugInfo
                  };
                }
                
                // If we couldn't find the button, try direct navigation
                log(`Trying to directly navigate to user profile for: ${userHandle}`);
                debugInfo.actions.push('Attempting direct navigation');
                
                // Xiaohongshu user profile URLs can be in different formats
                // Let's try the most common ones
                const possibleUrls = [
                  `https://www.xiaohongshu.com/user/profile/${userHandle}`,
                  `https://www.xiaohongshu.com/user/${userHandle}`
                ];
                
                // Append the current URL in case it's already a user profile
                debugInfo.currentUrl = window.location.href;
                debugInfo.actions.push(`Current URL: ${window.location.href}`);
                
                for (const url of possibleUrls) {
                  log(`Trying URL: ${url}`);
                  debugInfo.actions.push(`Navigating to: ${url}`);
                  window.location.href = url;
                  
                  // Wait for navigation
                  await wait(5000);
                  
                  // Check if there's a follow button now
                  const followButton = document.querySelector('button.follow-button') || 
                                     document.querySelector('[class*="follow-button"]');
                  
                  if (followButton) {
                    log('Found follow button after direct navigation');
                    return { 
                      success: true, 
                      directNavigation: true,
                      debugInfo
                    };
                  }
                }
                
                // If we're still here, we couldn't find the follow button
                log('Failed to find follow button after direct navigation attempts');
                
                // Take a snapshot of the HTML for debugging
                debugInfo.html = document.body.innerHTML.substring(0, 5000);
                
                // Find all buttons on the page
                const allButtons = document.querySelectorAll('button');
                debugInfo.allButtons = Array.from(allButtons).map(btn => ({
                  className: btn.className,
                  innerText: btn.innerText,
                  innerHTML: btn.innerHTML.substring(0, 50)
                }));
                
                return { 
                  success: false, 
                  error: 'Could not find follow button after direct navigation',
                  debugInfo
                };
              } catch (err) {
                log(`Error in direct navigation: ${err.message}`);
                return { 
                  success: false, 
                  error: err.message,
                  debugInfo
                };
              }
            },
            args: [handle]
          });
          
          console.log('Direct navigation result:', JSON.stringify(profilePageResult[0]?.result, null, 2));
          
          // Close the tab after operation - immediately if successful, after a delay if not
          if (searchTab) {
            const isSuccessful = profilePageResult[0]?.result?.success;
            setTimeout(() => {
              chrome.tabs.remove(searchTab.id);
              console.log(`Tab ${searchTab.id} closed ${isSuccessful ? 'immediately after success' : 'after timeout'}`);
            }, isSuccessful ? 300 : 10000);
          }
          
          // Process the direct navigation result
          if (profilePageResult[0]?.result?.success) {
            // If direct follow was successful
            if (profilePageResult[0]?.result?.directFollow) {
              console.log('Sending success response with userId:', userId);
              try {
                // Prepare a well-formatted result object
                const followResult = {
                  type: 'xiaohongshu_follow_result',
                  data: {
                    success: profilePageResult[0]?.result?.followSuccess,
                    userId,
                    handle,
                    message: profilePageResult[0]?.result?.followSuccess ? 
                            `Successfully followed user ${handle}` : 
                            `Found but failed to follow user ${handle}`
                  }
                };
                
                console.log('Broadcasting follow result');
                
                // 1. Try to send back directly to original sender
                if (sender && sender.tab && sender.tab.id) {
                  chrome.tabs.sendMessage(sender.tab.id, followResult);
                  console.log(`Sent direct response to sender tab: ${sender.tab.id}`);
                }
                
                // 2. Broadcast via runtime message (this will reach all extension pages)
                chrome.runtime.sendMessage(followResult);
                console.log('Broadcast follow result via runtime message');
                
                // 3. Store the result in chrome.storage for persistence
                chrome.storage.local.get(['successfulXiaohongshuFollows'], (result) => {
                  const existingFollows = result.successfulXiaohongshuFollows || {};
                  const updatedFollows = {
                    ...existingFollows,
                    [userId]: { 
                      handle, 
                      success: profilePageResult[0]?.result?.followSuccess, 
                      timestamp: Date.now() 
                    }
                  };
                  chrome.storage.local.set({ successfulXiaohongshuFollows: updatedFollows });
                  console.log(`Stored follow result in chrome.storage for persistence: ${userId}`);
                });
                
                // 4. Also send in alternate format (only via runtime)
                chrome.runtime.sendMessage({
                  type: 'xiaohongshu_direct_follow_result',
                  success: profilePageResult[0]?.result?.followSuccess,
                  userId,
                  handle,
                  message: profilePageResult[0]?.result?.followSuccess ? 
                          `Successfully followed user ${handle}` : 
                          `Found but failed to follow user ${handle}`
                });
              } catch (e) {
                console.error('Error sending follow result messages:', e);
              }
              return;
            }
            
            // If direct navigation found the profile but didn't follow
            sendResponse({ 
              success: false, 
              userId, 
              handle,
              error: 'Found user profile but could not complete follow action',
              debug: profilePageResult[0]?.result?.debugInfo
            });
            return;
          }
          
          // Check if we got a clear indication that the user doesn't exist
          if (profilePageResult[0]?.result?.userNotFound) {
            sendResponse({ 
              success: false, 
              userId, 
              handle,
              error: 'User does not exist on Xiaohongshu',
              debug: profilePageResult[0]?.result?.debugInfo
            });
            return;
          }
          
          // If all attempts failed
          sendResponse({ 
            success: false,
            userId,
            handle,
            error: 'Could not find or follow user on Xiaohongshu',
            debug: {
              search: profilePageResult[0]?.result?.debugInfo,
              directNavigation: profilePageResult[0]?.result?.debugInfo
            }
          });
          return;
        } catch (error) {
          console.error('Error executing script:', error);
          if (searchTab) {
            // Keep the tab open longer for debugging
            setTimeout(() => chrome.tabs.remove(searchTab.id), 10000);
          }
          sendResponse({ 
            success: false, 
            error: error.message 
          });
        }
      } catch (error) {
        console.error('Error executing script:', error);
        if (searchTab) {
          // Keep the tab open longer for debugging
          setTimeout(() => chrome.tabs.remove(searchTab.id), 10000);
        }
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
    })();
    
    return true; // Keep the message channel open for the async response
  }
});
