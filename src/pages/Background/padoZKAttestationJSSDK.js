import { v4 as uuidv4 } from 'uuid';
import { getSysConfig, getProofTypes } from '@/services/api/config';

import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
const fetchAttestationTemplateList = async () => {
  try {
    const fetchRes = await getProofTypes({
      type: 'web_cred',
    });
    const { rc, mc, result } = fetchRes;
    if (rc === 0) {
      await chrome.local.storage.set({
        webProofTypes: JSON.stringify(result2),
      });
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
    }
  } catch {}
};
fetchAttestationTemplateList();
fetchConfigure();
export const padoZKAttestationJSSDKMsgListener = async (
  request,
  sender,
  sendResponse,
  USERPASSWORD,
  fullscreenPort,
  processAlgorithmReq,
  pageDecodeMsgListener
) => {
  const { name, params } = request;
  if (name === 'initAttest') {
    processAlgorithmReq({
      reqMethodName: 'start',
    });

    const currentWindowTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    dappTabId = currentWindowTabs[0].id;
    await chrome.local.storage.set({
      padoZKAttestationJSSDKDappId: dappTabId,
    });
    console.log('333pado-bg-receive-initAttest', dappTabId);
  }
  if (name === 'startAttest') {
    chrome.storage.local.set({
      beginAttestFromJSSDK: '1',
      padoZKAttestationJSSDKWalletAddress: params.walletAddress,
    });
    const { webProofTypes } = await chrome.local.storage.get(['webProofTypes']);
    const webProofTypesList = JSON.parse(webProofTypes);
    const templateObj = webProofTypesList.find(
      (i) => i.id === params.attestationTypeId
    );
    const verificationContent = Object.values(
      ALLVERIFICATIONCONTENTTYPEEMAP
    ).find((k) => {
      const obj = ALLVERIFICATIONCONTENTTYPEEMAP[k];
      const { name } = activeWebProofTemplate;
      return name === obj.label || name === contentObj.templateName;
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
      ...templateObj,
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
  if (name === 'attestResult') {
    // TODO-sdk
    let hasGetTwitterScreenName = false;
    pageDecodeMsgListener(
      params,
      sender,
      sendResponse,
      USERPASSWORD,
      fullscreenPort,
      hasGetTwitterScreenName
    );
  }
};
