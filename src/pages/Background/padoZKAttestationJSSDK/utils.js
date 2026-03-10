import { getPadoUrl, getProxyUrl, getZkPadoUrl } from '@/config/envConstants';


export const getDynamicAlgoApi = (algoApiType, algoApis) => {
  const jsonobj = {
    padoUrl: algoApis[0],
    zkPadoUrl: algoApis[1],
    proxyUrl: algoApis[2],
  };
  return jsonobj[algoApiType];
};
export const getDefaultAlgoApi = async (algoApiType) => {
  let targetUrl;
  if (algoApiType === 'padoUrl') {
    targetUrl = await getPadoUrl();
  } else if (algoApiType === 'zkPadoUrl') {
    targetUrl = await getZkPadoUrl();
  } else if (algoApiType === 'proxyUrl') {
    targetUrl = await getProxyUrl();
  }
  return targetUrl;
};
export const getAlgoApi = async (algoApiType, algoApis) => {
  if (algoApis) {
    return getDynamicAlgoApi(algoApiType, algoApis);
  } else {
    return await getDefaultAlgoApi(algoApiType);
  }
};
