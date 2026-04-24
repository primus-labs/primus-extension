
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
    dataPageTemplate,
  } = form;
  const dataPageTemplateObj =
    typeof dataPageTemplate === 'string'
      ? safeJsonParse(dataPageTemplate, null)
      : dataPageTemplate;
  const checkContext = dataPageTemplateObj?.checkContext ?? 'true';
  const appSignParameters = JSON.parse(ext.appSignParameters);
  const user = await assembleUserInfoParams({}, true, appSignParameters?.userAddress);
  let authUseridHash;
  if (user.userid != null && user.userid !== '') {
    authUseridHash = strToHex(String(user.userid));
  }

  const timeStampStr = (+new Date()).toString();
  const padoUrl = await getPadoUrl();
  const proxyUrl = await getProxyUrl();
  const zkPadoUrl = await getZkPadoUrl();

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

async function assembleUserInfoParams(_form, isFromSDK, sdkUserAddress) {
  const storage = await safeStorageGet(['userInfo']);
  const userInfo = storage.userInfo;

  let formatAddress;
  if (isFromSDK && sdkUserAddress) {
    formatAddress = sdkUserAddress;
    console.log('algorithmParams-userAddress-isFromSDK', formatAddress);
  }
  console.log('algorithmParams-userAddress', formatAddress);

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

