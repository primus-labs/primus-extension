import { v4 as uuidv4 } from 'uuid';
import { ethers, utils } from 'ethers';
import { getSysConfig, getProofTypes } from '@/services/api/config';
import { regenerateAttestation } from '@/services/api/cred';
import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
import {
  LINEASCHEMANAME,
  SCROLLSCHEMANAME,
  BNBSCHEMANAME,
  BNBGREENFIELDSCHEMANAME,
  OPBNBSCHEMANAME,
} from '@/config/chain';
import { PADOADDRESS } from '@/config/envConstants';
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

export const padoZKAttestationJSSDKMsgListener = async (
  request,
  sender,
  sendResponse,
  USERPASSWORD,
  fullscreenPort,
  processAlgorithmReq
) => {
  const { name, params } = request;
  if (name === 'initAttest') {
    const currentWindowTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const dappTabId = currentWindowTabs[0].id;
    await chrome.storage.local.set({
      padoZKAttestationJSSDKDappTabId: dappTabId,
      padoZKAttestationJSSDKBeginAttest: '1',
    });
    processAlgorithmReq({
      reqMethodName: 'start',
    });
    await fetchAttestationTemplateList();
    await fetchConfigure();

    console.log('333pado-bg-receive-initAttest', dappTabId);
  }
  if (name === 'startAttest') {
    chrome.storage.local.set({
      padoZKAttestationJSSDKWalletAddress: params.walletAddress,
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
    const {
      attestationTypeId,
      params: { tokenSymbol, assetsBalance, followersCount },
    } = params;
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

    // attestationType: 'Social Connections';
    // dataSourceId: 'x';
    // fetchType: 'Web';
    // verificationContent: 'X Followers';
    // verificationValue: '1';

    const requestid = uuidv4();

    let activeAttestationParams = {
      dataSourceId: activeWebProofTemplate.dataSource,
      verificationContent,
      verificationValue,
      fetchType: 'Web',
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
      ['KYC Status', 'Account Ownership'].includes(verificationContent)
    ) {
      activeAttestationParams.attestationType = 'Humanity Verification';
    } else if (['X Followers'].includes(verificationContent)) {
      activeAttestationParams.attestationType = 'Social Connections';
      activeWebProofTemplate.datasourceTemplate.responses[1].conditions.subconditions[1].value =
        followersCount;
    }

    await chrome.storage.local.set({
      padoZKAttestationJSSDKActiveRequestAttestation: JSON.stringify(
        activeAttestationParams
      ),
    });
    const currRequestTemplate = {
      ...activeAttestationParams,
      ...activeWebProofTemplate,
    };
    const currentWindowTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    console.log(
      '333-bg-startAttest',
      currentWindowTabs,
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
  // if (name === 'attestResult') {
  //   // TODO-sdk

  //   pageDecodeMsgListener(
  //     params,
  //     sender,
  //     sendResponse,
  //     USERPASSWORD,
  //     fullscreenPort,
  //     hasGetTwitterScreenName
  //   );
  // }
  if (name === 'getAttestationResultTimeout') {
    await chrome.storage.local.remove([
      'padoZKAttestationJSSDKBeginAttest',
      'padoZKAttestationJSSDKWalletAddress',
      'padoZKAttestationJSSDKActiveRequestAttestation',
      'activeRequestAttestation',
    ]);

    const { configMap } = await chrome.storage.local.get(['configMap']);

    const attestTipMap =
      JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE) ?? {};
    console.log('333-bg-getAttestationResultTimeout');
    const errorMsgTitle = 'Humanity Verification failed!';

    const msgObj = {
      type: attestTipMap['00002'].type,
      title: errorMsgTitle,
      desc: attestTipMap['00002'].desc,
      sourcePageTip: attestTipMap['00002'].title,
    };
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
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: { result: false, msgObj, reStartFlag: true },
    });
  }
  if (name === 'verifyAttestation') {
    const { attestationRequestId, chainName } = params;
    const currentWindowTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const dappTabId = currentWindowTabs[0].id;
    await chrome.storage.local.set({
      padoZKAttestationJSSDKDappTabId: dappTabId,
    });
    console.log('33333-1', dappTabId);
    const { credentials } = await chrome.storage.local.get(['credentials']);
    const curCredential = JSON.parse(credentials)[attestationRequestId];
    console.log(
      '333-bg-sdk-receive-verifyAttestation',
      curCredential,
      attestationRequestId,
      chainName
    );
    let verifyResult = false;
    let verifyMsg = '';
    if (curCredential) {
      const { signature, sourceUseridHash } = curCredential;
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
        } else if (
          formatNetworkName &&
          formatNetworkName.indexOf('Scroll') > -1
        ) {
          Name = SCROLLSCHEMANAME;
        } else if (
          formatNetworkName &&
          formatNetworkName.indexOf('BNB Greenfield') > -1
        ) {
          Name = BNBGREENFIELDSCHEMANAME;
        } else if (
          formatNetworkName &&
          formatNetworkName.indexOf('opBNB') > -1
        ) {
          Name = OPBNBSCHEMANAME;
        } else {
          Name = 'EAS';
          // Name = 'EAS-Ethereum';
        }
        return Name;
      };
      const requestParams = {
        rawParam: Object.assign(curCredential, {
          ext: null,
        }),
        greaterThanBaseValue: true,
        signature: signature,
        newSigFormat: schemaNameFn(chainName),
        sourceUseridHash: sourceUseridHash,
      };
      const { rc, result } = await regenerateAttestation(requestParams);
      if (rc === 0) {
        const {
          eip712MessageRawDataWithSignature: {
            domain,
            message,
            signature,
            types,
          },
        } = result;
        try {
          delete domain.salt;
          const result = utils.verifyTypedData(
            domain,
            types,
            message,
            signature
          );
          console.log('333Verification successful:', result);
          verifyResult = PADOADDRESS.toLowerCase() === result.toLowerCase();
          verifyMsg = verifyResult
            ? 'Verification successful'
            : 'Validation failed';
        } catch (error) {
          console.error('Verification failed:', error);
          verifyResult = false;
          verifyMsg = 'Something went wrong';
        }
      }
    } else {
      verifyResult = false;
      verifyMsg = "Can't find the proof";
    }
    
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'verifyAttestationRes',
      params: { result: verifyResult, msg: verifyMsg },
    });
    console.log('33333-2', dappTabId);
  }
};
