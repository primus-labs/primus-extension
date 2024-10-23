import { eventReport } from '@/services/api/usertracker';
import { regenerateAttestation } from '@/services/api/cred';
import { pageDecodeMsgListener } from './pageDecode.js';
import { postMsg, strToHexSha256 } from '@/utils/utils';
import { getDataSourceAccount } from './dataSourceUtils';
import { schemaNameFn, regenerateAttest } from './padoZKAttestationJSSDK/utils';
import { padoExtensionVersion } from '@/config/constants';

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
  const {
    padoZKAttestationJSSDKBeginAttest,
    padoZKAttestationJSSDKDappTabId: dappTabId,
    configMap,
    activeRequestAttestation,
    padoZKAttestationJSSDKAttestationPresetParams,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKDappTabId',
    'configMap',
    'activeRequestAttestation',
    'padoZKAttestationJSSDKAttestationPresetParams',
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
    console.log(
      'debugSDK-3-5-bg-algorithm-receive-offscreen-getAttestation',
      new Date().toLocaleString()
    );
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
      eventInfo.rawData.attestOrigin =
        padoZKAttestationJSSDKAttestationPresetParams
          ? JSON.parse(padoZKAttestationJSSDKAttestationPresetParams)
              .attestOrigin
          : '';
    }
    eventReport(eventInfo);
  }

  if (padoZKAttestationJSSDKBeginAttest === '1') {
    if (resMethodName === 'start') {
      processAlgorithmReq({
        reqMethodName: 'init',
      });

      const { padoZKAttestationJSSDKDappTabId: dappTabId, webProofTypes } =
        await chrome.storage.local.get([
          'padoZKAttestationJSSDKDappTabId',
          'webProofTypes',
        ]);
      // console.log('333jssdk-init-completed', dappTabId);
      const attestationTypeIdList = (
        webProofTypes ? JSON.parse(webProofTypes) : []
      ).map((i) => {
        return {
          text: i.description,
          value: i.id,
        };
      });
      console.log(
        'debugSDK-2-bg-response-sdk-initAttestationRes',
        new Date().toLocaleString()
      );
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
    if (resMethodName === 'getAttestation') {
      // console.log('333-bg-receive-getAttestation', message.res);
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
          hasGetTwitterScreenName,
          undefined
        );
      }
      let resParams = { result };
      if (!result) {
        resParams.errorData = {
          title: msgObj.title,
          desc: msgObj.desc,
          code: '00001',
        };
      }
      console.log(
        'debugSDK-4-bg-algorithm-send-sdk-getAttestationRes',
        new Date().toLocaleString(),
        resParams
      );
      chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'getAttestationRes',
        params: resParams,
      });
    }
    if (resMethodName === 'getAttestationResult') {
      // console.log('333-bg-recceive-getAttestationResult', message.res);
      console.log(
        'debugSDK-5-2-bg-algorithm-receive-offscreen-getAttestationResult',
        new Date().toLocaleString(),
        message.res,
        'messageResuestTime:',
        message.timestamp.toLocaleString()
      );
      const attestTipMap =
        JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE) ?? {};
      // console.log('333-bg-recceive-getAttestationResult2', dappTabId);
      if (!message.res) {
        return;
      }
      const { retcode, content, retdesc, details } = JSON.parse(message.res);
      // console.log('333-bg-recceive-getAttestationResult3');
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
        eventInfo.rawData.attestOrigin = activeAttestationParams
          ? activeAttestationParams.attestOrigin
          : '';
      }

      if (retcode === '0') {
        // console.log(
        //   '333-bg-recceive-getAttestationResult4',
        //   activeAttestationParams
        // );
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
          // console.log('333-bg-recceive-getAttestationResult6', acc);
          let fullAttestation = {
            ...content,
            ...parsedActiveRequestAttestation,
            ...activeAttestationParams,
            account: acc,
          };
          // console.log('333-bg-recceive-getAttestationResult7', fullAttestation);
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
          // console.log('333-bg-success', fullAttestation);
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
                hasGetTwitterScreenName,
                undefined
              );
              // console.log('333-bg-success2');
              await chrome.storage.local.remove([
                'padoZKAttestationJSSDKBeginAttest',
                'padoZKAttestationJSSDKWalletAddress',
                'padoZKAttestationJSSDKAttestationPresetParams',
                'padoZKAttestationJSSDKXFollowerCount',
                'activeRequestAttestation',
              ]);
              // console.log(
              //   '333-bg-success3',
              //   dappTabId,
              //   activeRequestId,
              //   eip712MessageRawDataWithSignature
              // );
              console.log(
                'debugSDK-6-bg-algorithm-send-sdk-startAttestationRes',
                new Date().toLocaleString(),
                activeRequestId
              );
              chrome.tabs.sendMessage(dappTabId, {
                type: 'padoZKAttestationJSSDK',
                name: 'startAttestationRes',
                params: {
                  result: true,
                  data: {
                    attestationRequestId: activeRequestId,
                    eip712MessageRawDataWithSignature,
                  },
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
          // console.log(
          //   '333-bg-al-notMeet1',
          //   activeAttestationParams,
          //   parsedActiveRequestAttestation
          // );
          // attestTipMap
          let title = errorMsgTitle;
          let msgObj = {
            type: 'error',
            title,
            desc: '',
            sourcePageTip: '',
          };
          let errorCode;

          if (parsedActiveRequestAttestation.reqType === 'web') {
            if (!content.signature && content.encodedData) {
              errorCode = '00103';
              // linea event had bund
            } else {
              if (
                activeAttestationParams?.verificationContent ===
                  'Assets Proof' &&
                activeAttestationParams?.dataSourceId === 'binance'
              ) {
                let type, desc, title;
                errorCode = '00102';
                type = attestTipMap[errorCode].type;
                desc = attestTipMap[errorCode].desc;
                title = attestTipMap[errorCode].title;
                Object.assign(msgObj, {
                  type,
                  desc,
                  sourcePageTip: title,
                });
              } else {
                errorCode = '00104';
                Object.assign(msgObj, {
                  type: attestTipMap[errorCode].type,
                  desc: attestTipMap[errorCode].desc,
                  sourcePageTip: attestTipMap[errorCode].title,
                });
              }
              // console.log('333-bg-al-notMeet2', attestTipMap);
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
            let resParams = { result: false };
            if (!resParams.result) {
              resParams.errorData = {
                title: msgObj.title,
                desc: msgObj.desc,
                code: errorCode,
              };
            }
            console.log(
              'debugSDK-6-bg-algorithm-send-sdk-startAttestationRes',
              new Date().toLocaleString(),
              JSON.stringify(resParams)
            );
            chrome.tabs.sendMessage(dappTabId, {
              type: 'padoZKAttestationJSSDK',
              name: 'startAttestationRes',
              params: resParams,
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
        // TODO-test-yilin
        if (code === '30004') {
        } else {
          processAlgorithmReq({ reqMethodName: 'stop' });
        }
        // TODO-test-yilin
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

        // console.log(
        //   '333codeTipObj',
        //   codeTipObj,
        //   parsedActiveRequestAttestation
        // );
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
          let resParams = { result: false };
          if (!resParams.result) {
            resParams.errorData = {
              title: msgObj.title,
              desc: msgObj.desc,
              code: code,
            };
            resParams.reStartFlag = true;
          }
          console.log(
            'debugSDK-6-bg-algorithm-send-sdk-startAttestationRes',
            new Date().toLocaleString(),
            JSON.stringify(resParams)
          );
          chrome.tabs.sendMessage(dappTabId, {
            type: 'padoZKAttestationJSSDK',
            name: 'startAttestationRes',
            params: resParams,
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
