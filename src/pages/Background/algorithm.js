import { eventReport } from '@/services/api/usertracker';
import { pageDecodeMsgListener } from './pageDecode/index.js';
import { addSDKParamsToReportParamsFn } from './utils/reportEvent.js';
import { getErrorMsgTitleFn } from './utils/handleError.js';
import { sendInitAttestationRes } from './utils/msgTransfer.js';

export const algorithmMsgListener = async (
  message,
  sender,
  sendResponse,
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
  const activeAttestationParams = padoZKAttestationJSSDKAttestationPresetParams
    ? JSON.parse(padoZKAttestationJSSDKAttestationPresetParams)
    : {};
  const extendedParamsObj = activeAttestationParams?.extendedParams
    ? JSON.parse(activeAttestationParams.extendedParams)
    : {};
  if (resMethodName === `start`) {
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
        res: !!message.res,
        requestid: message.requestid,
        order: '6',
      },
    };
    eventInfo.rawData = await addSDKParamsToReportParamsFn(eventInfo.rawData);
    eventReport(eventInfo);
  }

  if (padoZKAttestationJSSDKBeginAttest) {
    if (resMethodName === 'start') {
      await sendInitAttestationRes();
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

          let errorMsgTitle = await getErrorMsgTitleFn();

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
        console.log(
          'send getAttestationRes msg to dappTab',
          'dappTabId',
          dappTabId,
          'time:',
          new Date().toLocaleString(),
          'resParams',
          JSON.stringify(resParams)
        );
        // async function getTabInfo(tabId) {
        try {
          const tab = await chrome.tabs.get(dappTabId);
          console.log('tab info：', tab);
        } catch (error) {
          console.error('Failed to get tab info：', error);
        }
        // }
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
      const { retcode, content, details, isUserClick } = JSON.parse(
        message.res
      );
      if (isUserClick === 'true') {
        await chrome.storage.local.set({
          getAttestationResultRes: message.res,
        });
        const parsedActiveRequestAttestation = activeRequestAttestation
          ? JSON.parse(activeRequestAttestation)
          : {};
        let errorMsgTitle = await getErrorMsgTitleFn();

        if (retcode === '0') {
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
          if (
            content.balanceGreaterThanBaseValue === 'true' &&
            content.signature
          ) {
            const activeRequestId = parsedActiveRequestAttestation.requestid;
            if (activeRequestId !== content?.requestid) {
              return;
            }

            // await sucFn(JSON.parse(content.encodedData));
            const passRes = JSON.parse(content.encodedData);
            passRes.extendedData = content.extendedData;
            passRes.allJsonResponse = content.allJsonResponse;
            await sucFn(passRes);
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
              '-1200010': 'Invalid message.',
              '-1002001': 'Invalid App ID.',
              '-1002002': 'Invalid App Secret.',
            };
            const tipMapForPrimusNetworkSdk = {
              '-500': 'Unexpected attester node program failure.',
              '-10100':
                'Task cannot be executed again due to unexpected failure.',
              '-10101':
                'This task has already been completed. No need to resubmit.',
              '-10102': 'This task is still in progress. No need to resubmit.',
              '-10103':
                'Submission limit reached for this task. Initiate a new task to continue.',
              '-10104':
                'Failed to get task details. Please check the attester node condition or task ID.',
              '-10105':
                'Invalid attestation parameters. Please check the connection between the node and the template server.',
              '-10106':
                'Attestation template ID mismatch between task and attester node.',
              '-10107':
                'The user wallet address provided during attestation mismatch with submission.',
              '-10108':
                'Invalid task ID. Please ensure the submitted ID matches the task.',
              '-10109':
                'Task cannot be executed again. Please check your task fees.',
              '-10110':
                'Attester node mismatch. Ensure the node matches the task specification and resubmit.',
              '-10111':
                'Task submitted past the allowed time limit (15 minutes).',
            };
            const tipMapForSubscription = {
              '-1002003': 'Trial quota exhausted.',
              '-1002004': 'Subscription expired.',
              '-1002005': 'Quota exhausted.',
            };
            const totalTipMapForSdk = Object.assign(
              {},
              tipMapForSdk,
              tipMapForPrimusNetworkSdk,
              tipMapForSubscription
            );
            if (
              extraData &&
              JSON.parse(extraData) &&
              Object.keys(totalTipMapForSdk).includes(
                JSON.parse(extraData).errorCode + ''
              )
            ) {
              errorCode = JSON.parse(extraData).errorCode + '';
              if (
                extendedParamsObj.handleReSubmitCodes &&
                extendedParamsObj.handleReSubmitCodes.includes(errorCode)
              ) {
                sucFn({
                  attestation: JSON.stringify({}),
                  taskId: extendedParamsObj.taskId,
                });
                return;
              }
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

          }
        } else if (retcode === '2') {
          const {
            errlog: { code },
          } = details;
          processAlgorithmReq({ reqMethodName: 'stop' });
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
  }
};
