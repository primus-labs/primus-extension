import { eventReport } from '@/services/api/usertracker';
import { regenerateAttestation } from '@/services/api/cred';
import { pageDecodeMsgListener } from './pageDecode/index.js';
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
    // var eventInfo = {
    //   eventType: 'ATTESTATION_INIT_1',
    //   rawData: {},
    // };
    // eventReport(eventInfo);
    processAlgorithmReq({
      reqMethodName: 'init',
    });
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
    if (padoZKAttestationJSSDKBeginAttest) {
      const prestParamsObj = JSON.parse(
        padoZKAttestationJSSDKAttestationPresetParams
      );

      eventInfo.rawData.attestOrigin = prestParamsObj.attestOrigin;
      eventInfo.rawData.event = prestParamsObj.attestOrigin;
      eventInfo.rawData.templateId = prestParamsObj.attTemplateID;
    }
    eventReport(eventInfo);
  }

  if (padoZKAttestationJSSDKBeginAttest) {
    if (resMethodName === 'start') {
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
      const { retcode, isUserClick } = JSON.parse(message.res);
      if (isUserClick === 'true') {
        let msgObj = {};
        let result = false;
        if (retcode === '0') {
          result = true;
        } else {
          // if (retcode === '2' || retcode === '1')
          result = false;
          const activeAttestationParams = JSON.parse(
            padoZKAttestationJSSDKAttestationPresetParams
          );
          let errorMsgTitle = [
            'Assets Verification',
            'Humanity Verification',
          ].includes(activeAttestationParams.attestationType)
            ? `${activeAttestationParams.attestationType} failed!`
            : `${activeAttestationParams.attestationType} proof failed!`;

          errorMsgTitle =
            retcode === '2'
              ? 'Wrong parameters. '
              : 'Too many requests. Please try again later.';

          msgObj = {
            type: 'error',
            title: errorMsgTitle, // no use
            desc: 'The algorithm has not been initialized.Please try again later.', // no use
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
            processAlgorithmReq
          );
          await chrome.storage.local.remove([
            'padoZKAttestationJSSDKBeginAttest',
            'padoZKAttestationJSSDKWalletAddress',
            'padoZKAttestationJSSDKAttestationPresetParams',
            'padoZKAttestationJSSDKXFollowerCount',
            'activeRequestAttestation',
          ]);
          processAlgorithmReq({ reqMethodName: 'stop' });
        }
        let resParams = { result };
        if (!result) {
          resParams.errorData = {
            title: msgObj.title,
            desc: msgObj.desc,
            code: retcode === '2' ? '00001' : '00000',
            data: message.res,
          };
        }
        chrome.tabs.sendMessage(dappTabId, {
          type: 'padoZKAttestationJSSDK',
          name: 'getAttestationRes',
          params: resParams,
        });
      }
    }
    if (resMethodName === 'getAttestationResult') {
      let attestTipMap = {};
      if (
        configMap &&
        JSON.parse(configMap) &&
        JSON.parse(configMap).ATTESTATION_PROCESS_NOTE
      ) {
        attestTipMap = JSON.parse(
          JSON.parse(configMap).ATTESTATION_PROCESS_NOTE
        );
      }
      if (!message.res) {
        return;
      }
      const { retcode, content, retdesc, details, isUserClick } = JSON.parse(
        message.res
      );
      if (isUserClick === 'true') {
        await chrome.storage.local.set({
          getAttestationResultRes: message.res,
        });
        const activeAttestationParams = JSON.parse(
          padoZKAttestationJSSDKAttestationPresetParams
        );
        const parsedActiveRequestAttestation = activeRequestAttestation
          ? JSON.parse(activeRequestAttestation)
          : {};
        let errorMsgTitle = [
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
        if (padoZKAttestationJSSDKBeginAttest) {
          eventInfo.rawData.attestOrigin = activeAttestationParams.attestOrigin;
          eventInfo.rawData.event = activeAttestationParams.attestOrigin;
          eventInfo.rawData.templateId = activeAttestationParams.attTemplateID;
        }

        if (retcode === '0') {
          if (
            content.balanceGreaterThanBaseValue === 'true' &&
            content.signature
          ) {
            const activeRequestId = parsedActiveRequestAttestation.requestid;
            if (activeRequestId !== content?.requestid) {
              return;
            }
            let fullAttestation = {};
            if (
              !padoZKAttestationJSSDKBeginAttest ||
              padoZKAttestationJSSDKBeginAttest === '1'
            ) {
              const acc = await getDataSourceAccount(
                activeAttestationParams.dataSourceId
              );
              fullAttestation = {
                ...content,
                ...parsedActiveRequestAttestation,
                ...activeAttestationParams,
                account: acc,
              };
              if (fullAttestation.verificationContent === 'X Followers') {
                let count = 0;
                if (padoZKAttestationJSSDKBeginAttest) {
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
            }

            const sucFn = async (resData) => {
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
                processAlgorithmReq
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
                params: {
                  result: true,
                  data: resData,
                },
              });
            };
            if (padoZKAttestationJSSDKBeginAttest === '1') {
              const { rc, result } = await regenerateAttest(
                fullAttestation,
                activeAttestationParams.chainName
              );
              if (rc === 0) {
                const { eip712MessageRawDataWithSignature } = result;
                const resData = {
                  attestationRequestId: activeRequestId,
                  eip712MessageRawDataWithSignature,
                };
                await sucFn(resData);
              }
            } else {
              // await sucFn(JSON.parse(content.encodedData));
              const passRes = JSON.parse(content.encodedData);
              passRes.extendedData = content.extendedData;
              await sucFn(passRes);
            }

            const uniqueId = strToHexSha256(content.signature);
            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              attestationId: uniqueId,
              status: 'SUCCESS',
              reason: '',
              // event: fromEvents,
              address: content?.address,
            });
            eventReport(eventInfo);
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
            let errorCode;

            const { extraData } = content;
            const tipMapForSdk = {
              '-1200010': 'Invalid message.', // chatgpt input error
              '-1002001': 'Invalid App ID.',
              '-1002002': 'Invalid App Secret.',
            };
            const tipMapForPrimusNetworkSdk = {
              '-500':
                'General error, indicating an unknown exception occurred in the attester-node',
              '-10100': 'Incorrect task status!',
              '-10101': 'The task has been executed successfully!',
              '-10102':
                'A task with the same ID is currently being executed on the current node!',
              '-10103':
                'The number of task initiations for the same task exceeds the limit (currently set to 5 times)!',
              '-10104': 'Failed to obtain task details!',
              '-10105': 'Error in attestation template parameters!',
              '-10106':
                'The URL in the algorithm parameters is inconsistent with the URL defined in the template!',
              '-10107':
                'The address in the algorithm parameters is inconsistent with that when submitting the task!',
              '-10108':
                'Invalid template ID; details cannot be queried based on the specified ID!',
              '-10109':
                'The task status is failed or partial_success_settled (task funds have been withdrawn)!',
              '-10110':
                'The current attester is not the attester specified in the task!',
              '-10111': 'The task submission time exceeds the 1-hour limit!',
            };
            const totalTipMapForSdk = Object.assign(
              {},
              tipMapForSdk,
              tipMapForPrimusNetworkSdk
            );
            if (
              extraData &&
              JSON.parse(extraData) &&
              Object.keys(totalTipMapForSdk).includes(
                JSON.parse(extraData).errorCode + ''
              )
            ) {

              errorCode = JSON.parse(extraData).errorCode + '';
              const showTip = totalTipMapForSdk[errorCode];
              Object.assign(msgObj, {
                type: '',
                desc: showTip,
                sourcePageTip: showTip,
              });
            } else {
              if (!content.signature && content.encodedData) {
                errorCode = '00103'; // linea event had bund
                Object.assign(msgObj, {
                  type: attestTipMap[errorCode].type,
                  desc: attestTipMap[errorCode].desc,
                  sourcePageTip: attestTipMap[errorCode].title,
                });
              } else if (
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
              hasGetTwitterScreenName,
              processAlgorithmReq
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
            chrome.tabs.sendMessage(dappTabId, {
              type: 'padoZKAttestationJSSDK',
              name: 'startAttestationRes',
              params: resParams,
            });

            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              status: 'FAILED',
              reason: 'Not met the requirements',
              // event: fromEvents,
              address: parsedActiveRequestAttestation?.address,
            });
            eventReport(eventInfo);
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
            sourcePageTip:
              code === '40002' ? 'SSLCertificateError' : codeTipObj.title,
            code: `Error ${code}`,
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
            hasGetTwitterScreenName,
            processAlgorithmReq
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
              data: message.res,
            };
            resParams.reStartFlag = true;
          }
          chrome.tabs.sendMessage(dappTabId, {
            type: 'padoZKAttestationJSSDK',
            name: 'startAttestationRes',
            params: resParams,
          });
        } else {
          chrome.storage.local.set({
            attestationLogInQuery: message.res,
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
