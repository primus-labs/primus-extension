import { regenerateAttestation } from '@/services/api/cred';
import { getPadoUrl, getProxyUrl, getZkPadoUrl } from '@/config/envConstants';


export const regenerateAttest = async (orginAttestation, chainName) => {
  const {
    signature,
    sourceUseridHash,
    type,
    dataToBeSigned,
    source,
  } = orginAttestation;
  const requestParams = {
    rawParam:
      type === 'BREVIS_TRANSACTION_PROOF#1' ||
      ['google', 'discord'].includes(source)
        ? orginAttestation.rawParam
        : Object.assign(orginAttestation, {
            ext: null,
          }),
    greaterThanBaseValue: true,
    signature,
    newSigFormat: 'EAS',
    sourceUseridHash: sourceUseridHash,
  };
  if (type === 'BREVIS_TRANSACTION_PROOF#1') {
    requestParams.dataToBeSigned = dataToBeSigned;
  }
  const regenerateAttestRes = await regenerateAttestation(requestParams);
  return regenerateAttestRes;
};

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
