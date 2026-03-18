
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
  } = form;
  // const urlObj = new URL(dataPageTemplate.baseUrl);
  // const baseName = urlObj.host;
  const user = await assembleUserInfoParams({}, true);
  const { userInfo } = await safeStorageGet(['userInfo']);
  const { id: authUserId } = safeJsonParse(userInfo, { id: '' }) || {};
  const authUseridHash = strToHex(authUserId);

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
  };
  if (ext.padoUrl && ext.proxyUrl) {
    params.padoUrl = ext.padoUrl;
    params.proxyUrl = ext.proxyUrl;
  }

  return params;
}

async function assembleUserInfoParams(_form, isFromSDK) {
  const {
    userInfo,
    padoZKAttestationJSSDKWalletAddress,
  } = await safeStorageGet([
    'userInfo',
    'padoZKAttestationJSSDKWalletAddress',
  ]);
  let formatAddress;
  if (isFromSDK && padoZKAttestationJSSDKWalletAddress) {
    formatAddress = padoZKAttestationJSSDKWalletAddress;
    console.log('algorithmParams-userAddress-isFromSDK', formatAddress);
  }
  console.log(
    'algorithmParams-userAddress',
    padoZKAttestationJSSDKWalletAddress
  );

  const { id, token: loginToken } = safeJsonParse(userInfo, { id: '', token: '' }) || {};
  const user = {
    userid: id,
    address: formatAddress,
    token: loginToken,
  };
  return user;
}

