
import { eventReport } from '@/services/api/usertracker';
import {
  claimUniNFT,
  getUniNFTResult,
} from '@/services/api/event';
import { CredVersion } from '@/config/attestation';

let pollingUniProofIntervalTimer = ''
let claimResult = {}
let dappTabId = null
let errorCode = '00010'
let uniSwapProofRequestId = null
let attestationForm = {}

export const attestBrevisFn = async (form, dappTabIdP) => {
  
  const {
    padoZKAttestationJSSDKDappTabId: dappTabId2,
  } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKDappTabId',
  ]);
  dappTabId = dappTabIdP || dappTabId2;
  console.log('attestBrevisFn-dappTabId', dappTabIdP, dappTabId2);
  attestationForm = form
  const { account, requestid, signature, timestamp } = form;
  uniSwapProofRequestId = requestid;
  const curConnectedAddr = account;
  // const curConnectedAddr = '0x4813e2ea41ff0e8ff2f60cc484bc832776314980'; // DEL!!!-TEST-brevis
  try {
    const uniSwapProofParams = {
      signature,
      address: curConnectedAddr,
    };
    const { rc, result, mc } = await claimUniNFT({
      signature,
      address: curConnectedAddr,
      timestamp,
    });

    if (rc === 0 && result) {
      claimResult = { ...result, address: curConnectedAddr };
      pollingUniProofIntervalTimer = setInterval(() => {
        pollingUniProofResult(claimResult);
      }, 10000);
    } else {
      await removeCacheFn()
      chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: {
          result: false,
          errorData: {
            title: 'Verification failed',
            desc: 'Do not have eligible transactions.',
            code: errorCode,
          },
          // data: {
          //   attestationRequestId: activeRequestId,
          //   eip712MessageRawDataWithSignature,
          // },
        },
      });
    }
  } catch (e) {
    await removeCacheFn();
    chrome.tabs.sendMessage(dappTabId, {
      type: 'padoZKAttestationJSSDK',
      name: 'startAttestationRes',
      params: {
        result: false,
        errorData: {
          title: 'Verification failed',
          desc: 'The attestation process has been interrupted for some unknown service breakdown. Please try again later.',
          code: errorCode,
        },
      },
    });
  }
}

const pollingUniProofResult = async (claimResult) => {
  try {
    const { rc, result } = await getUniNFTResult({
      address: claimResult.address,
      blockNumber: claimResult.blockNumber,
    });
    if (rc === 0) {
      clearInterval(pollingUniProofIntervalTimer)
      const {
        dataSignatureResponse: {
          result: dataSignatureResponseResult,
          ...otherResponse
        },
        dataSignatureParams,
      } = result;
      var eventInfo = {
        eventType: 'API_ATTESTATION_GENERATE',
        rawData: {
          source: 'brevis',
          schemaType: 'BREVIS_TRANSACTION_PROOF#1', // UNISWAP_PROOF
          sigFormat: 'EAS-Ethereum',
          attestationId: uniSwapProofRequestId,
          // event: fromEvents,
        },
      };
      const { account, requestid, signature, timestamp, dataSourceId } =
        attestationForm;
      const fullAttestation = {
        ...dataSignatureResponseResult,
        ...otherResponse,
        ...dataSignatureParams,
        address: account,
        source: dataSourceId,
        ...attestationForm,
        requestid: uniSwapProofRequestId,
        // event: fromEvents,
        version: CredVersion,
        credVersion: CredVersion,
        type: 'BREVIS_TRANSACTION_PROOF#1',
        templateId: '101', // brevis template id
      };
      const credentialsFromStore = JSON.parse(
        (await chrome.storage.local.get('credentials'))?.credentials || '{}'
      );
      const credentialsObj = { ...credentialsFromStore };
      credentialsObj[uniSwapProofRequestId] = fullAttestation;
      await chrome.storage.local.set({
        credentials: JSON.stringify(credentialsObj),
      });
      eventInfo.rawData.status = 'SUCCESS';
      eventInfo.rawData.reason = '';
      eventReport(eventInfo);
      console.log('bg-sdk-brevis-startAttestationRes', dappTabId);
      await chrome.tabs.sendMessage(dappTabId, {
        type: 'padoZKAttestationJSSDK',
        name: 'startAttestationRes',
        params: {
          result: true,
          data: {
            attestationRequestId: uniSwapProofRequestId,
            eip712MessageRawDataWithSignature:
              result.dataSignatureResponse.eip712MessageRawDataWithSignature,
          },
        },
      });
      
    } else {
    }
  } catch (e) {
    console.log('pollingUniProofResult e', e);
  } finally {
  }
};

const removeCacheFn = async () => {
  await chrome.storage.local.remove([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKWalletAddress',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'padoZKAttestationJSSDKXFollowerCount',
    'activeRequestAttestation',
  ]);
};

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (tabId === dappTabId) {
    if (pollingUniProofIntervalTimer) {
      clearInterval(pollingUniProofIntervalTimer);
    }
  }
});