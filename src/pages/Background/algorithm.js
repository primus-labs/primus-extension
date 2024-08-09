import { eventReport } from '@/services/api/usertracker';
import { pageDecodeMsgListener } from './pageDecode.js';
import {
  postMsg,
  getAccount,
  strToHexSha256,
} from '@/utils/utils';
import { DATASOURCEMAP } from '@/config/dataSource2';
export const algorithmMsgListener = async (
  message,
  sender,
  sendResponse,
  USERPASSWORD,
  fullscreenPort,
  processAlgorithmReq
) => {
  const { resMethodName } = message;
  let hasGetTwitterScreenName = false;
  const { padoZKAttestationJSSDKBeginAttest } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
  ]);
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
    if (padoZKAttestationJSSDKBeginAttest === '1') {
      eventInfo.rawData.origin = 'padoAttestationJSSDK';
    }
    eventReport(eventInfo);
  }
  console.log(
    '333pado-bg-padoZKAttestationJSSDKBeginAttest',
    padoZKAttestationJSSDKBeginAttest
  );
  if (padoZKAttestationJSSDKBeginAttest === '1') {
    console.log('333-1');
    if (resMethodName === 'start') {
      console.log('333-2')
      processAlgorithmReq({
        reqMethodName: 'init',
      });
      console.log('333-3');
      
      const { padoZKAttestationJSSDKDappTabId: dappTabId } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
      console.log('333jssdk-init-completed', dappTabId);
      chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'initAttestRes',
      });
    }
    if (resMethodName === 'getAttestation') {
      console.log('333-bg-receive-getAttestation', message.res);
      const { padoZKAttestationJSSDKDappTabId: dappTabId } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);

      const { retcode } = JSON.parse(message.res);
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
      console.log('333-bg-recceive-getAttestationResult', message.res);
      const {
        padoZKAttestationJSSDKDappTabId: dappTabId,
        configMap,
        activeRequestAttestation,
        padoZKAttestationJSSDKActiveRequestAttestation,
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKDappTabId',
        'configMap',
        'activeRequestAttestation',
        'padoZKAttestationJSSDKActiveRequestAttestation',
      ]);
      console.log('333-bg-recceive-getAttestationResult2');
      const attestTipMap = JSON.parse(configMap).ATTESTATION_PROCESS_NOTE ?? {};

      const { retcode, content, retdesc, details } = JSON.parse(message.res);
      console.log('333-bg-recceive-getAttestationResult3');
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
      if (padoZKAttestationJSSDKBeginAttest === '1') {
        eventInfo.rawData.origin = 'padoAttestationJSSDK';
      }

      if (retcode === '0') {
        console.log('333-bg-recceive-getAttestationResult4');
        await chrome.storage.local.remove([
          'padoZKAttestationJSSDKBeginAttest',
        ]);
        if (
          content.balanceGreaterThanBaseValue === 'true' &&
          content.signature
        ) {
          console.log(
            '333-bg-recceive-getAttestationResult5',
            parsedActiveRequestAttestation,
            parsedActiveRequestAttestation.requestid,
            content.requestid
          );
          const activeRequestId = parsedActiveRequestAttestation.requestid;
          if (activeRequestId !== content?.requestid) {
            return;
          }
          let storages = await chrome.storage.local.get([
            activeAttestation.dataSourceId,
          ]);
          console.log(
            '333-bg-recceive-getAttestationResult5.5',
            storages[activeAttestation.dataSourceId]
          );
          const acc = getAccount(
            DATASOURCEMAP[activeAttestation.dataSourceId],
            JSON.parse(storages[activeAttestation.dataSourceId])
          );
          console.log('333-bg-recceive-getAttestationResult6', acc);
          let fullAttestation = {
            ...content,
            ...parsedActiveRequestAttestation,
            ...activeAttestation,
            account: acc,
          };
          console.log('333-bg-recceive-getAttestationResult7', fullAttestation);
          if (fullAttestation.verificationContent === 'X Followers') {
            const xFollowerCount = sessionStorage.getItem('xFollowerCount');
            fullAttestation.xFollowerCount = xFollowerCount;
            sessionStorage.removeItem('xFollowerCount');
          }
          const { credentials } = await chrome.storage.local.get([
            'credentials',
          ]);
          const credentialsObj = { ...JSON.parse(credentials) };
          credentialsObj[activeRequestId] = fullAttestation;
          await chrome.storage.local.set({
            credentials: JSON.stringify(credentialsObj),
          });
          await chrome.storage.local.remove([
            'activeRequestAttestation',
            'padoZKAttestationJSSDKActiveRequestAttestation',
          ]);
          console.log('333-bg-success', fullAttestation);
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
            // event: fromEvents,
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
            // event: fromEvents,
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
        await chrome.storage.local.remove([
          'padoZKAttestationJSSDKBeginAttest',
          'padoZKAttestationJSSDKActiveRequestAttestation',
        ]);
        const {
          errlog: { code, desc },
        } = details;
        processAlgorithmReq({ reqMethodName: 'stop' });
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
          // event: fromEvents
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
    }
  } else {
    if (fullscreenPort) {
      postMsg(fullscreenPort, message);
    }
  }
};
