import { v4 as uuidv4 } from 'uuid';
import { getSysConfig, getProofTypes } from '@/services/api/config';
import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
import { pageDecodeMsgListener } from './pageDecode.js';

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

    const activeWebProofTemplate = webProofTypesList.find(
      (i) => i.id === params.attestationTypeId
    );
    const verificationContent = Object.keys(
      ALLVERIFICATIONCONTENTTYPEEMAP
    ).find((k) => {
      const obj = ALLVERIFICATIONCONTENTTYPEEMAP[k];
      const { name } = activeWebProofTemplate;
      return name === obj.label || name === obj.templateName;
    });
    let verificationValue;
    if (verificationContent === 'KYC Status') {
      verificationValue = 'Basic Verification';
    } else if (verificationContent === 'Account ownership') {
      verificationValue = 'Account owner';
    }

    const requestid = uuidv4();
    const userForm = {
      dataSourceId: activeWebProofTemplate.dataSource,
      verificationContent,
      verificationValue,
    };
    const activeAttestationParams = {
      ...userForm,
      attestationType: 'Humanity Verification', // TODO-sdk
      fetchType: 'Web',
    };

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
    console.log('333-bg-startAttest', currentWindowTabs);
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
    const attestTipMap = JSON.parse(configMap).ATTESTATION_PROCESS_NOTE ?? {};
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
  }
};
