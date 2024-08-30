import { v4 as uuidv4 } from 'uuid';

import { getSysConfig, getProofTypes } from '@/services/api/config';
// import { eventReport } from '@/services/api/usertracker';
// import { attestByDelegationProxyFee } from '@/services/chains/eas.js';
import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
import { updateAlgoUrl } from '@/config/envConstants';

// import {
//   LINEASCHEMANAME,
//   SCROLLSCHEMANAME,
//   BNBSCHEMANAME,
//   BNBGREENFIELDSCHEMANAME,
//   OPBNBSCHEMANAME,
//   CURENV,
//   ONCHAINLIST,
// } from '@/config/chain';
// import { PADOADDRESS } from '@/config/envConstants';
// import { regenerateAttestation } from '@/services/api/cred';
// import { strToHexSha256 } from '@/utils/utils';
import { pageDecodeMsgListener } from './pageDecode.js';
import { getDataSourceAccount } from './dataSourceUtils';

let hasGetTwitterScreenName = false;
const fetchAttestationTemplateList = async () => {
  try {
    const fetchRes = await getProofTypes({
      type: 'web_cred',
    });
    const { rc, mc, result } = fetchRes;
    if (rc === 0) {
      await chrome.storage.local.set({
        webProofTypes: JSON.stringify(result),
      });
      console.log('333-bg-sdk-fetchAttestationTemplateList', result);
    } else {
      // alert('getProofTypes network error');
    }
  } catch {}
};
const fetchConfigure = async () => {
  try {
    const { rc, result } = await getSysConfig();
    if (rc === 0 && result) {
      const configMap = result.reduce((prev, curr) => {
        const { configName, configValue } = curr;
        prev[configName] = configValue;
        return prev;
      }, {});
      await chrome.storage.local.set({
        configMap: JSON.stringify(configMap),
      });
      console.log('333-bg-sdk-fetchConfigure', configMap);
    }
  } catch {}
};

const storeDappTabId = async () => {
  const currentWindowTabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const dappTabId = currentWindowTabs[0]?.id;
  await chrome.storage.local.set({
    padoZKAttestationJSSDKDappTabId: dappTabId,
  });
  return dappTabId;
};



// const getAttestation = async (attetstationRequestId) => {
//   const { credentials } = await chrome.storage.local.get(['credentials']);
//   const curCredential = JSON.parse(credentials)[attetstationRequestId];
//   return curCredential;
// };

export const padoZKAttestationJSSDKMsgListener = async (
  request,
  sender,
  sendResponse,
  USERPASSWORD,
  fullscreenPort,
  processAlgorithmReq
) => {
  const { name, params } = request;
  if (name === 'initAttestation') {
   
    const dappTabId = await storeDappTabId();
    await chrome.storage.local.set({
      padoZKAttestationJSSDKBeginAttest: '1',
    });
    processAlgorithmReq({
      reqMethodName: 'start',
    });
    updateAlgoUrl();
    await fetchAttestationTemplateList();
    await fetchConfigure();
    console.log('333pado-bg-receive-initAttestation', dappTabId);
  }
  if (name === 'startAttestation') {
    const {
      activeRequestAttestation: lastActiveRequestAttestationStr,
      padoZKAttestationJSSDKDappTabId: dappTabId,
    } = await chrome.storage.local.get([
      'activeRequestAttestation',
      'padoZKAttestationJSSDKDappTabId',
    ]);
    if (lastActiveRequestAttestationStr) {
      const desc =
        'A proof is currently being generated. Please try again later.';
      let resParams = { result: false };
      if (!resParams.result) {
        resParams.errorData = {
          title: '',
          desc,
          code: '00003',
        };
      }
      chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: resParams,
      });
      return;
    }

    const {
      attestationTypeId,
      tokenSymbol,
      assetsBalance,
      followersCount,
      chainName,
      walletAddress,
      dappName,
    } = params;
    chrome.storage.local.set({
      padoZKAttestationJSSDKBeginAttest: '1',
      padoZKAttestationJSSDKWalletAddress: walletAddress,
    });
    const { webProofTypes } = await chrome.storage.local.get(['webProofTypes']);
    let webProofTypesList = [];
    if (webProofTypes) {
      webProofTypesList = JSON.parse(webProofTypes);
    } else {
      await fetchAttestationTemplateList();
      const { webProofTypes } = await chrome.storage.local.get([
        'webProofTypes',
      ]);
      webProofTypesList = JSON.parse(webProofTypes);
    }

    const activeWebProofTemplate = webProofTypesList.find(
      (i) => i.id === attestationTypeId
    );
    const verificationContent = Object.keys(
      ALLVERIFICATIONCONTENTTYPEEMAP
    ).find((k) => {
      const obj = ALLVERIFICATIONCONTENTTYPEEMAP[k];
      const { name } = activeWebProofTemplate;
      if (['Assets Proof', 'Token Holding', 'X Followers'].includes(name)) {
        return name === obj.value;
      }
      return name === obj.label || name === obj.templateName;
    });
    let verificationValue;
    if (verificationContent === 'KYC Status') {
      verificationValue = 'Basic Verification';
    } else if (verificationContent === 'Account ownership') {
      verificationValue = 'Account owner';
    } else if (verificationContent === 'Assets Proof') {
      verificationValue = assetsBalance;
    } else if (verificationContent === 'Token Holding') {
      verificationValue = tokenSymbol;
    } else if (verificationContent === 'X Followers') {
      verificationValue = followersCount;
      await chrome.storage.local.set({
        padoZKAttestationJSSDKXFollowerCount: verificationValue,
      });
    }
    const requestid = uuidv4();

    let activeAttestationParams = {
      dataSourceId: activeWebProofTemplate.dataSource,
      verificationContent,
      verificationValue,
      fetchType: 'Web',
      attestOrigin: dappName
    };
    const acc = await getDataSourceAccount(
      activeAttestationParams.dataSourceId
    );
    activeAttestationParams.account = acc;

    if (['Assets Proof', 'Token Holding'].includes(verificationContent)) {
      activeAttestationParams.attestationType = 'Assets Verification';
      const responses = activeWebProofTemplate.datasourceTemplate.responses;
      const lastResponse = responses[responses.length - 1];
      const lastResponseConditions = lastResponse.conditions;
      const lastResponseConditionsSubconditions =
        lastResponseConditions.subconditions;
      if (activeAttestationParams.verificationContent === 'Assets Proof') {
        // change verification value
        lastResponseConditions.value =
          activeAttestationParams.verificationValue;
        // for okx
        if (lastResponseConditionsSubconditions) {
          const lastSubCondition =
            lastResponseConditionsSubconditions[
              lastResponseConditionsSubconditions.length - 1
            ];
          lastSubCondition.value = activeAttestationParams.verificationValue;
        }
      } else if (
        activeAttestationParams.verificationContent === 'Token Holding'
      ) {
        if (lastResponseConditionsSubconditions) {
          const firstSubCondition = lastResponseConditionsSubconditions[0];
          firstSubCondition.value = activeAttestationParams.verificationValue;
          firstSubCondition.subconditions[0].value =
            activeAttestationParams.verificationValue;
        }
      }
      chrome.storage.local.remove(['beginAttest', 'getAttestationResultRes']);
    } else if (
      ['KYC Status', 'Account ownership'].includes(verificationContent)
    ) {
      activeAttestationParams.attestationType = 'Humanity Verification';
    } else if (['X Followers'].includes(verificationContent)) {
      activeAttestationParams.attestationType = 'Social Connections';
      activeWebProofTemplate.datasourceTemplate.responses[1].conditions.subconditions[1].value =
        followersCount;
    }

    await chrome.storage.local.set({
      padoZKAttestationJSSDKAttestationPresetParams: JSON.stringify(
        Object.assign({ chainName }, activeAttestationParams)
      ),
    });
    const currRequestTemplate = {
      ...activeAttestationParams,
      ...activeWebProofTemplate,
    };

    console.log(
      '333-bg-startAttest',
      activeAttestationParams,
      activeWebProofTemplate
    );
    pageDecodeMsgListener(
      {
        type: 'pageDecode',
        name: 'init',
        params: {
          ...currRequestTemplate,
          requestid,
        },
        // extensionTabId: currentWindowTabs[0]?.id,
        operation: 'attest',
      },
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort,
      hasGetTwitterScreenName
    );
  }

  if (name === 'getAttestationResult') {
    processAlgorithmReq({
      reqMethodName: 'getAttestationResult',
      params: {},
    });
  }

  if (name === 'getAttestationResultTimeout') {
    const { configMap, padoZKAttestationJSSDKAttestationPresetParams } =
      await chrome.storage.local.get([
        'configMap',
        'padoZKAttestationJSSDKAttestationPresetParams',
      ]);
    const attestTipMap =
      JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE) ?? {};
    console.log(
      '333-bg-getAttestationResultTimeout',
      padoZKAttestationJSSDKAttestationPresetParams
    );
    const activeAttestationParams = JSON.parse(
      padoZKAttestationJSSDKAttestationPresetParams
    );
    const errorMsgTitle = [
      'Assets Verification',
      'Humanity Verification',
    ].includes(activeAttestationParams.attestationType)
      ? `${activeAttestationParams.attestationType} failed!`
      : `${activeAttestationParams.attestationType} proof failed!`;
    const code = '00002';
    const msgObj = {
      type: attestTipMap[code].type,
      title: errorMsgTitle,
      desc: attestTipMap[code].desc,
      sourcePageTip: attestTipMap[code].title,
    };
    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKWalletAddress',
      'padoZKAttestationJSSDKAttestationPresetParams',
      'activeRequestAttestation',
    ]);
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
    processAlgorithmReq({
      reqMethodName: 'stop',
    });
    const { padoZKAttestationJSSDKDappTabId: dappTabId } =
      await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
    let resParams = { result: false };
    if (!resParams.result) {
      resParams.errorData = {
        title: msgObj.title,
        desc: msgObj.desc,
        code,
      };
      resParams.reStartFlag = true;
    }
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: resParams,
    });
  }

  if (name === 'stopOffscreen') {
    const { activeRequestAttestation } = await chrome.storage.local.get([
      'activeRequestAttestation',
    ]);
    if (activeRequestAttestation) {
      const activeRequestAttestationObj = JSON.parse(activeRequestAttestation);
      if (
        !activeRequestAttestationObj.attestOrigin
      ) {
        processAlgorithmReq({
          reqMethodName: 'stop',
        });
        console.log('333-Attesting-remove10');
        await chrome.storage.local.remove([
          'padoZKAttestationJSSDKBeginAttest',
          'padoZKAttestationJSSDKAttestationPresetParams',
          'padoZKAttestationJSSDKXFollowerCount',
          'activeRequestAttestation',
        ]);
      }
    }
  }

  // if (name === 'sendToChainRes') {
  //   const { attestationRequestId, chainName, onChainRes: upChainRes } = params;
  //   const curCredential = await getAttestation(attestationRequestId);
  //   console.log(
  //     '333-bg-sdk-receive-sendToChainRes',
  //     curCredential,
  //     attestationRequestId,
  //     chainName
  //   );
  //   if (curCredential) {
  //       const { address, schemaType, source } = curCredential;
  //       console.log('333-bg-sdk-receive-sendToChain2');
  //       try {
  //         const eventType = `${schemaType}-${schemaNameFn(chainName)}`;
  //         console.log('333-bg-sdk-receive-sendToChain3', eventType);
  //         let upchainNetwork = chainName;
  //         if (CURENV === 'production' && chainName === 'Linea Goerli') {
  //           upchainNetwork = 'Linea Mainnet';
  //           console.log('333-CURENV', CURENV, upchainNetwork);
  //         }
  //         // const uniqueId = strToHexSha256(upChainParams.signature);
  //         var eventInfo = {
  //           eventType: 'UPPER_CHAIN',
  //           rawData: {
  //             network: upchainNetwork,
  //             type: eventType,
  //             source: source,
  //             // attestationId: uniqueId,
  //             address,
  //           },
  //         };
  //         if (upChainRes) {
  //           if (upChainRes.error) {
  //             // if (upChainRes.error === 1) {
  //             //   sendToChainResult = false;
  //             //   sendToChainMsg = 'Your balance is insufficient';
  //             // } else if (upChainRes.error === 2) {
  //             //   sendToChainResult = false;
  //             //   sendToChainMsg = 'Please try again later.';
  //             // }
  //             eventInfo.rawData = Object.assign(eventInfo.rawData, {
  //               status: 'FAILED',
  //               reason: upChainRes.message,
  //             });
  //             eventReport(eventInfo);
  //             return;
  //           }
  //           const newProvided = curCredential.provided ?? [];
  //           const currentChainObj = ONCHAINLIST.find(
  //             (i) => chainName === i.title
  //           );
  //           currentChainObj.attestationUID = upChainRes;
  //           currentChainObj.submitAddress = address;
  //           newProvided.push(currentChainObj);
  //           const { credentials } = await chrome.storage.local.get([
  //             'credentials',
  //           ]);
  //           const cObj = { ...JSON.parse(credentials) };

  //           cObj[attestationRequestId] = Object.assign(curCredential, {
  //             provided: newProvided,
  //           });
  //           await chrome.storage.local.set({
  //             credentials: JSON.stringify(cObj),
  //           });

  //           if (curCredential.reqType === 'web') {
  //             if (newProvided.length && newProvided.length > 0) {
  //               const flag = newProvided.some(
  //                 (i) => i.chainName.indexOf('Linea') > -1
  //               );
  //               if (flag) {
  //                 await chrome.storage.local.set({
  //                   mysteryBoxRewards: '1',
  //                 });
  //               }
  //             }
  //           }
  //           // sendToChainResult = true;
  //           // sendToChainMsg = 'Your attestation is recorded on-chain!';
  //           eventInfo.rawData = Object.assign(eventInfo.rawData, {
  //             status: 'SUCCESS',
  //             reason: '',
  //             txHash: upChainRes,
  //           });
  //           eventReport(eventInfo);
  //         } else {
  //           // sendToChainResult = true;
  //           // sendToChainMsg = 'Please try again later.';
  //           eventInfo.rawData = Object.assign(eventInfo.rawData, {
  //             status: 'FAILED',
  //             reason: 'attestByDelegationProxyFee error',
  //           });
  //           eventReport(eventInfo);
  //         }
  //       } catch {}

  //   }
  // }
};
