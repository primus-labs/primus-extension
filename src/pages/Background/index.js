import {
  getAllOAuthSources,
  checkIsLogin,
  bindUserAddress,
  refreshAuthData,
} from '@/services/api/user';
import { getSysConfig, getProofTypes } from '@/services/api/config';
import {
  getCurrentDate,
  postMsg,
  sub,
  getAccount,
  strToHexSha256,
} from '@/utils/utils';
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
import { dataSourceWebMsgListener } from './dataSourceWeb.js';
import { padoZKAttestationJSSDKMsgListener } from './padoZKAttestationJSSDK.js';
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
  const { resType, resMethodName, type, name, params } = message;
  if (resType === 'algorithm') {
    if (resMethodName === `start`) {
      var eventInfo = {
        eventType: 'ATTESTATION_INIT_1',
        rawData: {},
      };
      eventReport(eventInfo);
    } else if (resMethodName === `init`) {
      var eventInfo = {
        eventType: 'ATTESTATION_INIT_4',
        rawData: {},
      };
      eventReport(eventInfo);
    } else if (resMethodName === `getAttestation`) {
      var eventInfo = {
        eventType: 'ATTESTATION_START_BACKGROUND',
        rawData: {
          fullscreenPort: !!fullscreenPort,
          res: !!message.res,
          requestid: message.requestid,
          order: '6',
        },
      };
      eventReport(eventInfo);
    }
    const { beginAttestFromJSSDK } = await chrome.storage.local.get([
      'beginAttestFromJSSDK',
    ]);
    console.log('333pado-bg-beginAttestFromJSSDK', beginAttestFromJSSDK);
    if (beginAttestFromJSSDK === '1') {
      if (resMethodName === 'start') {
        processAlgorithmReq({
          reqMethodName: 'init',
        });
        console.log('333jssdk-init-completed');
        const { padoZKAttestationJSSDKDappId: dappTabId } =
          await chrome.local.storage.get(['padoZKAttestationJSSDKDappId']);
        chrome.tabs.sendMessage(dappTabId, {
          type: 'padoZKAttestationJSSDK',
          name: 'initAttestRes',
        });
      }
      if (resMethodName === 'getAttestation') {
        let hasGetTwitterScreenName = false;
        console.log('333-bg-recceive-getAttestation', message.res);
        const { padoZKAttestationJSSDKDappId: dappTabId } =
          await chrome.local.storage.get(['padoZKAttestationJSSDKDappId']);

        const { retcode } = JSON.parse(params);
        const msgObj = {};
        let result = null;
        if (retcode === '0') {
          result = true;
        } else if (retcode === '2') {
          result = false;
          // TODO-sdk
          const errorMsgTitle = `Humanity Verification failed!`;
          msgObj = {
            type: 'error',
            title: errorMsgTitle,
            desc: 'The algorithm has not been initialized.Please try again later.',
            sourcePageTip: errorMsgTitle,
          };
          // algorithm is not initialized
          pageDecodeMsgListener(
            {
              name: 'end',
              params: {
                result: 'warn',
                failReason: {
                  ...msgObj,
                },
              },
            },
            sender,
            sendResponse,
            USERPASSWORD,
            fullscreenPort,
            hasGetTwitterScreenName
          );
        }
        chrome.tabs.sendMessage(dappTabId, {
          type: 'padoZKAttestationJSSDK',
          name: 'getAttestationRes',
          params: { result, msgObj },
        });
      }
      if (resMethodName === 'getAttestationResult') {
        let hasGetTwitterScreenName = false;
        console.log(
          '333-bg-recceive-getAttestationResult',
          message.res,
          params
        );
        const {
          padoZKAttestationJSSDKDappId: dappTabId,
          configMap,
          activeRequestAttestation,
          padoZKAttestationJSSDKActiveRequestAttestation,
        } = await chrome.local.storage.get([
          'padoZKAttestationJSSDKDappId',
          'configMap',
          'activeRequestAttestation',
          'padoZKAttestationJSSDKActiveRequestAttestation',
        ]);
        const attestTipMap = configMap.ATTESTATION_PROCESS_NOTE ?? {};

        const { retcode, content, retdesc, details } = JSON.parse(message.res);

        // TODO-sdk activeAttestation
        const activeAttestation = JSON.parse(
          padoZKAttestationJSSDKActiveRequestAttestation
        );
        const parsedActiveRequestAttestation = activeRequestAttestation
          ? JSON.parse(activeRequestAttestation)
          : {};
        const errorMsgTitle = [
          'Assets Verification',
          'Humanity Verification',
        ].includes(activeAttestation.attestationType)
          ? `${activeAttestation.attestationType} failed!`
          : `${activeAttestation.attestationType} proof failed!`;
        var eventInfo = {
          eventType: 'ATTESTATION_GENERATE',
          rawData: {
            source: parsedActiveRequestAttestation.source,
            schemaType: parsedActiveRequestAttestation.schemaType,
            sigFormat: parsedActiveRequestAttestation.sigFormat,
          },
        };

        if (retcode === '0') {
          // clearFetchAttestationTimer();

          if (
            content.balanceGreaterThanBaseValue === 'true' &&
            content.signature
          ) {
            const activeRequestId = parsedActiveRequestAttestation.requestid;
            if (activeRequestId !== content?.requestid) {
              return;
            }
            const acc = getAccount(
              DATASOURCEMAP[activeAttestation.dataSourceId],
              sourceMap2[activeAttestation.dataSourceId]
            );
            let fullAttestation = {
              ...content,
              ...parsedActiveRequestAttestation,
              ...activeAttestation,
              account: acc,
            };
            if (fullAttestation.verificationContent === 'X Followers') {
              const xFollowerCount = sessionStorage.getItem('xFollowerCount');
              fullAttestation.xFollowerCount = xFollowerCount;
              sessionStorage.removeItem('xFollowerCount');
            }

            const credentialsObj = { ...credentialsFromStore };
            credentialsObj[activeRequestId] = fullAttestation;
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsObj),
            });
            await chrome.storage.local.remove(['activeRequestAttestation']);

            await initCredList();
            if (fullAttestation.reqType === 'web') {
               pageDecodeMsgListener(
                 {
                   name: 'end',
                   params: {
                     result: 'success',
                   },
                 },
                 sender,
                 sendResponse,
                 USERPASSWORD,
                 fullscreenPort,
                 hasGetTwitterScreenName
               );
              chrome.tabs.sendMessage(dappTabId, {
                type: 'padoZKAttestationJSSDK',
                name: 'startAttestationRes',
                params: { result: true },
              });
            }
            
            // suc
            const sucMsgTitle = [
              'Assets Verification',
              'Humanity Verification',
            ].includes(activeAttestation.attestationType)
              ? `${activeAttestation.attestationType} is created!`
              : `${activeAttestation.attestationType} proof is created!`;
            const msgObj = {
              type: 'suc',
              title: sucMsgTitle,
              desc: '',
              link: '/zkAttestation',
            };
            if (pathname !== '/zkAttestation') {
              msgObj.desc = 'See details in the zkAttestation page.';
            }
           

            const uniqueId = strToHexSha256(fullAttestation.signature);
            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              attestationId: uniqueId,
              status: 'SUCCESS',
              reason: '',
              event: fromEvents,
              address: fullAttestation?.address, // TODO-sdk
            });
            eventReport(eventInfo);
            var eventInfoEnd = {
              ...eventInfo,
              eventType: 'ATTESTATION_END',
            };
            eventReport(eventInfoEnd);
          } else if (
            !content.signature ||
            content.balanceGreaterThanBaseValue === 'false'
          ) {
            // attestTipMap
            let title = errorMsgTitle;
            let msgObj = {
              type: 'error',
              title,
              desc: '',
              sourcePageTip: '',
            };
            if (activeAttestation?.verificationContent === 'Assets Proof') {
              let type, desc, title;
              if (activeAttestation?.dataSourceId === 'okx') {
                type = attestTipMap['00101'].type;
                desc = attestTipMap['00101'].desc;
                title = attestTipMap['00101'].title;
              } else if (activeAttestation?.dataSourceId === 'binance') {
                type = attestTipMap['00102'].type;
                desc = attestTipMap['00102'].desc;
                title = attestTipMap['00102'].title;
              }
              Object.assign(msgObj, {
                type,
                desc,
                sourcePageTip: title,
              });
            }
            let btnTxt = '';

            if (parsedActiveRequestAttestation.reqType === 'web') {
              if (!content.signature && content.encodedData) {
                // linea event had bund
                Object.assign(msgObj, {
                  type: attestTipMap['00103'].type,
                  desc: attestTipMap['00103'].desc,
                  sourcePageTip: attestTipMap['00103'].title,
                });
              } else {
                Object.assign(msgObj, {
                  type: attestTipMap['00104'].type,
                  desc: attestTipMap['00104'].desc,
                  sourcePageTip: attestTipMap['00104'].title,
                });
              }
              pageDecodeMsgListener(
                {
                  name: 'end',
                  params: {
                    result: 'warn',
                    failReason: { ...msgObj },
                  },
                },
                sender,
                sendResponse,
                USERPASSWORD,
                fullscreenPort,
                hasGetTwitterScreenName
              );
              chrome.tabs.sendMessage(dappTabId, {
                type: 'padoZKAttestationJSSDK',
                name: 'startAttestationRes',
                params: { result: false, msgObj },
              });
            }

            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              status: 'FAILED',
              reason: 'Not met the requirements',
              event: fromEvents,
              address: parsedActiveRequestAttestation?.address,
            });
            eventReport(eventInfo);
            var eventInfoEnd = {
              ...eventInfo,
              eventType: 'ATTESTATION_END',
            };
            eventReport(eventInfoEnd);
          }
        } else if (retcode === '2') {
          const {
            errlog: { code, desc },
          } = details;
          processAlgorithmReq({reqMethodName: 'stop'})
          var eventInfoMsg = 'Something went wrong';
          let title = errorMsgTitle;
          let msgObj = {
            type: 'warn',
            title,
            desc: '',
            sourcePageTip: '',
            code: '',
          };
          let codeTipObj = attestTipMap[code];
          if (codeTipObj) {
          } else {
            codeTipObj = attestTipMap['99999'];
          }
          Object.assign(msgObj, {
            type: codeTipObj.type,
            desc: codeTipObj.desc,
            sourcePageTip: codeTipObj.title,
            code: `Error code: ${code}`,
          });

          
          if (
            retdesc.indexOf('connect to proxy error') > -1 ||
            retdesc.indexOf('WebSocket On Error') > -1 ||
            retdesc.indexOf('connection error') > -1
          ) {
            eventInfoMsg = 'Unstable internet connection';
          }
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            status: 'FAILED',
            reason: eventInfoMsg,
            detail: {
              code,
              desc,
            },
            event: fromEvents,
            address: parsedActiveRequestAttestation?.address,
          });
          eventReport(eventInfo);
          var eventInfoEnd = {
            ...eventInfo,
            eventType: 'ATTESTATION_END',
          };
          eventReport(eventInfoEnd);
          if (parsedActiveRequestAttestation.reqType === 'web') {
            pageDecodeMsgListener(
              {
                result: 'warn',
                failReason: { ...msgObj },
              },
              sender,
              sendResponse,
              USERPASSWORD,
              fullscreenPort,
              hasGetTwitterScreenName
            );
            chrome.tabs.sendMessage(dappTabId, {
              type: 'padoZKAttestationJSSDK',
              name: 'startAttestationRes',
              params: { result: false, msgObj },
            });
          }
        }

        chrome.tabs.sendMessage(dappTabId, {
          type: 'padoZKAttestationJSSDK',
          name: 'getAttestationResultRes',
          params: message.res,
        });
      }
    } else {
      if (fullscreenPort) {
        postMsg(fullscreenPort, message);
      }
    }
  }
  if (resType === 'report') {
    if (name === `offscreenReceiveGetAttestation`) {
      var eventInfo = {
        eventType: 'ATTESTATION_START_OFFSCREEN',
        rawData: {
          ...params,
        },
      };
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
      hasGetTwitterScreenName
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
      processAlgorithmReq,
      pageDecodeMsgListener
    );
  }
});
