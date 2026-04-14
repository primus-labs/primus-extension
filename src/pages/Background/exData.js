
import { CredVersion } from '@/config/constants';
import { getPadoUrl, getProxyUrl, getZkPadoUrl } from '@/config/envConstants';
import { strToHex } from '@/utils/utils';
import { safeStorageGet } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';

export async function assembleAlgorithmParamsForSDK(form, ext) {
  const {
    dataSource,
    algorithmType = 'proxytls',
    requestid: prevRequestid,
    sslCipherSuite,
    allJsonResponseFlag,
    checkContext,
  } = form;
  // const urlObj = new URL(dataPageTemplate.baseUrl);
  // const baseName = urlObj.host;
  const user = await assembleUserInfoParams({}, true);
  let authUseridHash;
  if (user.userid != null && user.userid !== '') {
    authUseridHash = strToHex(String(user.userid));
  }

  const timeStampStr = (+new Date()).toString();
  const padoUrl = await getPadoUrl();
  const proxyUrl = await getProxyUrl();
  const zkPadoUrl = await getZkPadoUrl();

  const appSignParameters = JSON.parse(ext.appSignParameters);
  let specialTask = '';
  if (appSignParameters?.computeMode === 'nonecomplete') {
    specialTask = 'CompleteHttpResponseCiphertext';
  } else if (appSignParameters?.computeMode === 'nonepartial') {
    specialTask = 'PartialHttpResponseCiphertext';
  }
  const params = {
    source: dataSource,
    requestid: prevRequestid || timeStampStr,
    padoUrl: algorithmType === 'proxytls' ? zkPadoUrl : padoUrl, // client <----> pado-server
    modelType: algorithmType,
    proxyUrl: proxyUrl,
    errLogUrl: 'wss://api.padolabs.org/logs',
    cipher: sslCipherSuite || '',
    getdatatime: timeStampStr,
    credVersion: CredVersion,
    // sigFormat: 'EAS-Ethereum',
    // schemaType,
    user,
    authUseridHash,
    setHostName: 'true',
    appParameters: {
      appId: appSignParameters.appId,
      appSignParameters: ext.appSignParameters,
      appSignature: ext.appSignature,
      additionParams: appSignParameters.additionParams
        ? appSignParameters.additionParams
        : '',
    },
    specialTask,
    getAllJsonResponse: allJsonResponseFlag === 'true' ? 'true' : 'false',
    checkContext: checkContext ?? 'true',
  };
  if (ext.padoUrl && ext.proxyUrl) {
    params.padoUrl = ext.padoUrl;
    params.proxyUrl = ext.proxyUrl;
  }

  return params;
}

async function assembleUserInfoParams(_form, isFromSDK) {
  const storage = await safeStorageGet([
    'userInfo',
    'padoZKAttestationJSSDKWalletAddress',
  ]);
  const userInfo = storage.userInfo;
  const padoZKAttestationJSSDKWalletAddress =
    storage.padoZKAttestationJSSDKWalletAddress;

  let formatAddress;
  if (isFromSDK && padoZKAttestationJSSDKWalletAddress) {
    formatAddress = padoZKAttestationJSSDKWalletAddress;
    console.log('algorithmParams-userAddress-isFromSDK', formatAddress);
  }
  console.log(
    'algorithmParams-userAddress',
    padoZKAttestationJSSDKWalletAddress
  );

  let userid;
  let loginToken;
  if (userInfo != null && typeof userInfo === 'string' && userInfo !== '') {
    const parsed = safeJsonParse(userInfo, null);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.id != null && parsed.id !== '') userid = parsed.id;
      if (parsed.token != null && parsed.token !== '') loginToken = parsed.token;
    }
  }

  return {
    userid,
    address: formatAddress,
    token: loginToken,
  };
}

