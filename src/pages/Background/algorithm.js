import { eventReport } from '@/services/api/usertracker';
import { regenerateAttestation } from '@/services/api/cred';
import { pageDecodeMsgListener } from './pageDecode.js';
import { postMsg, strToHexSha256 } from '@/utils/utils';
import { getDataSourceAccount } from './dataSourceUtils';
import {
  LINEASCHEMANAME,
  SCROLLSCHEMANAME,
  BNBSCHEMANAME,
  BNBGREENFIELDSCHEMANAME,
  OPBNBSCHEMANAME,
} from '@/config/chain';
const regenerateAttest = async (orginAttestation, chainName) => {
  const { signature, sourceUseridHash } = orginAttestation;
  const requestParams = {
    rawParam: Object.assign(orginAttestation, {
      ext: null,
    }),
    greaterThanBaseValue: true,
    signature,
    newSigFormat: schemaNameFn(chainName),
    sourceUseridHash: sourceUseridHash,
  };
  const regenerateAttestRes = await regenerateAttestation(requestParams);
  return regenerateAttestRes;
};
const schemaNameFn = (networkName) => {
  const formatNetworkName = networkName;
  let Name;
  if (formatNetworkName?.startsWith('Linea')) {
    Name = LINEASCHEMANAME;
  } else if (
    formatNetworkName &&
    (formatNetworkName.indexOf('BSC') > -1 ||
      formatNetworkName.indexOf('BNB Greenfield') > -1)
  ) {
    Name = BNBSCHEMANAME;
  } else if (formatNetworkName && formatNetworkName.indexOf('Scroll') > -1) {
    Name = SCROLLSCHEMANAME;
  } else if (
    formatNetworkName &&
    formatNetworkName.indexOf('BNB Greenfield') > -1
  ) {
    Name = BNBGREENFIELDSCHEMANAME;
  } else if (formatNetworkName && formatNetworkName.indexOf('opBNB') > -1) {
    Name = OPBNBSCHEMANAME;
  } else if (formatNetworkName && formatNetworkName.startsWith('Sepolia')) {
    Name = 'EAS-Sepolia';
  } else if (formatNetworkName && formatNetworkName.startsWith('Arbitrum')) {
    Name = 'EAS-Ethereum';
  } else {
    Name = 'EAS';
    // Name = 'EAS-Ethereum';
  }
  return Name;
};
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
      eventInfo.rawData.attestOrgin = 'padoAttestationJSSDK';
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
      console.log('333-2');
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
      const {
        padoZKAttestationJSSDKDappTabId: dappTabId,
        padoZKAttestationJSSDKAttestationPresetParams,
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKDappTabId',
        'padoZKAttestationJSSDKAttestationPresetParams',
      ]);

      const { retcode } = JSON.parse(message.res);
      let msgObj = {};
      let result = false;
      if (retcode === '0') {
        result = true;
      } else if (retcode === '2') {
        result = false;
        const activeAttestationParams = JSON.parse(
          padoZKAttestationJSSDKAttestationPresetParams
        );
        const errorMsgTitle = [
          'Assets Verification',
          'Humanity Verification',
        ].includes(activeAttestationParams.attestationType)
          ? `${activeAttestationParams.attestationType} failed!`
          : `${activeAttestationParams.attestationType} proof failed!`;

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
        padoZKAttestationJSSDKAttestationPresetParams,
      } = await chrome.storage.local.get([
        'padoZKAttestationJSSDKDappTabId',
        'configMap',
        'activeRequestAttestation',
        'padoZKAttestationJSSDKAttestationPresetParams',
      ]);

      const attestTipMap =
        JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE) ?? {};
      console.log('333-bg-recceive-getAttestationResult2', dappTabId);
      const { retcode, content, retdesc, details } = JSON.parse(message.res);
      console.log('333-bg-recceive-getAttestationResult3', message.res);
      const activeAttestationParams = JSON.parse(
        padoZKAttestationJSSDKAttestationPresetParams
      );
      const parsedActiveRequestAttestation = activeRequestAttestation
        ? JSON.parse(activeRequestAttestation)
        : {};
      const errorMsgTitle = [
        'Assets Verification',
        'Humanity Verification',
      ].includes(activeAttestationParams.attestationType)
        ? `${activeAttestationParams.attestationType} failed!`
        : `${activeAttestationParams.attestationType} proof failed!`;
      var eventInfo = {
        eventType: 'ATTESTATION_GENERATE',
        rawData: {
          source: parsedActiveRequestAttestation.source,
          schemaType: parsedActiveRequestAttestation.schemaType,
          sigFormat: parsedActiveRequestAttestation.sigFormat,
        },
      };
      if (padoZKAttestationJSSDKBeginAttest === '1') {
        eventInfo.rawData.attestOrgin = 'padoAttestationJSSDK';
      }

      if (retcode === '0') {
        console.log('333-bg-recceive-getAttestationResult4');
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
          const acc = await getDataSourceAccount(
            activeAttestationParams.dataSourceId
          );
          console.log('333-bg-recceive-getAttestationResult6', acc);
          let fullAttestation = {
            ...content,
            ...parsedActiveRequestAttestation,
            ...activeAttestationParams,
            account: acc,
            attestOrgin: 'padoAttestationJSSDK',
          };
          console.log('333-bg-recceive-getAttestationResult7', fullAttestation);
          if (fullAttestation.verificationContent === 'X Followers') {
            let count = 0;
            if (padoZKAttestationJSSDKBeginAttest === '1') {
              const { padoZKAttestationJSSDKXFollowerCount } =
                await chrome.storage.local.get([
                  'padoZKAttestationJSSDKXFollowerCount',
                ]);
              count = padoZKAttestationJSSDKXFollowerCount;
            }
            fullAttestation.xFollowerCount = count;
          }
          const { credentials } = await chrome.storage.local.get([
            'credentials',
          ]);
          const credentialsObj = credentials
            ? { ...JSON.parse(credentials) }
            : {};
          credentialsObj[activeRequestId] = fullAttestation;
          await chrome.storage.local.set({
            credentials: JSON.stringify(credentialsObj),
          });
          console.log('333-bg-success', fullAttestation);
          if (fullAttestation.reqType === 'web') {
            const { rc, result } = await regenerateAttest(
              fullAttestation,
              activeAttestationParams.chainName
            );
            if (rc === 0) {
              const { eip712MessageRawDataWithSignature } = result;
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
              console.log('333-bg-success2');
              await chrome.storage.local.remove([
                'padoZKAttestationJSSDKBeginAttest',
                'padoZKAttestationJSSDKWalletAddress',
                'padoZKAttestationJSSDKAttestationPresetParams',
                'padoZKAttestationJSSDKXFollowerCount',
                'activeRequestAttestation',
              ]);
              console.log(
                '333-bg-success3',
                dappTabId,
                activeRequestId,
                eip712MessageRawDataWithSignature
              );
              chrome.tabs.sendMessage(dappTabId, {
                type: 'padoZKAttestationJSSDK',
                name: 'startAttestationRes',
                params: {
                  result: true,
                  attestationRequestId: activeRequestId,
                  eip712MessageRawDataWithSignature,
                },
              });
            }
          }

          const uniqueId = strToHexSha256(fullAttestation.signature);
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            attestationId: uniqueId,
            status: 'SUCCESS',
            reason: '',
            // event: fromEvents,
            address: fullAttestation?.address,
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
          if (activeAttestationParams?.verificationContent === 'Assets Proof') {
            let type, desc, title;
            if (activeAttestationParams?.dataSourceId === 'okx') {
              type = attestTipMap['00101'].type;
              desc = attestTipMap['00101'].desc;
              title = attestTipMap['00101'].title;
            } else if (activeAttestationParams?.dataSourceId === 'binance') {
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

            await chrome.storage.local.remove([
              'padoZKAttestationJSSDKBeginAttest',
              'padoZKAttestationJSSDKWalletAddress',
              'padoZKAttestationJSSDKAttestationPresetParams',
              'padoZKAttestationJSSDKXFollowerCount',
              'activeRequestAttestation',
            ]);
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

        console.log('333codeTipObj', codeTipObj);
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
          await chrome.storage.local.remove([
            'padoZKAttestationJSSDKBeginAttest',
            'padoZKAttestationJSSDKWalletAddress',
            'padoZKAttestationJSSDKAttestationPresetParams',
            'padoZKAttestationJSSDKXFollowerCount',
            'activeRequestAttestation',
          ]);
          chrome.tabs.sendMessage(dappTabId, {
            type: 'padoZKAttestationJSSDK',
            name: 'startAttestationRes',
            params: { result: false, msgObj, reStartFlag: true },
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
