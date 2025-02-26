import { customFetch2 } from '../utils/request';
export const extraRequestFn2 = async (params) => {
  try {
    const { ...requestParams } = params;
    const requestRes = await customFetch2(requestParams);
    if (typeof requestRes === 'object' && requestRes !== null) {
      return requestRes;
    }
  } catch (e) {
    console.log('fetch custom request error', e);
  }
};

export const errorFn = async (errorData) => {
  let resParams = {
    result: false,
    errorData,
  };
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
  chrome.tabs.sendMessage(dappTabId, {
    type: 'padoZKAttestationJSSDK',
    name: 'getAttestationRes',
    params: resParams,
  });
  await chrome.storage.local.remove([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKWalletAddress',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'padoZKAttestationJSSDKXFollowerCount',
    'activeRequestAttestation',
  ]);
  if (dataSourcePageTabId) {
    await chrome.tabs.remove(dataSourcePageTabId);
  }
};


