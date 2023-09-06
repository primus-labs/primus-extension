import request from '@/utils/request';
type GETCONNECTPOLYGONIDQRCODEParams = {
  sessionId: string;
  update?: string;
};
type GETCONNECTPOLYGONIDRESULTParams = {
  sessionId: string;
  type: string; // 'connection' | 'claim'
};
type GETPOLYGONIDATTESTATIONParams = {
  claimId: string;
};

export const getConnectPolygonIdQrcode = (
  data: GETCONNECTPOLYGONIDQRCODEParams,
  config: any
) => {
  return request({
    method: 'get',
    url: `/polygon/connection/qrcode?sessionId=${data.sessionId}`,
    config,
  });
};

export const getConnectPolygonIdResult = (
  data: GETCONNECTPOLYGONIDRESULTParams,
  config: any
) => {
  return request({
    method: 'get',
    url: `/polygon/result?sessionId=${data.sessionId}&type=${data.type}`,
    config,
  });
};

export const attestForPolygonId = (
  data: GETCONNECTPOLYGONIDQRCODEParams,
  config: any
) => {
  return request({
    method: 'post',
    url: `/polygon/claim?sessionId=${data.sessionId}&update=${data.update}`,
    data,
    config,
  });
};

export const getPolygonIdAttestation = (
  data: GETPOLYGONIDATTESTATIONParams,
  config: any
) => {
  return request({
    method: 'get',
    url: `/polygon/claim?claimId=${data.claimId}`,
    config,
  });
};

export type ATTESTFORANTPARAMS = {
  credential: string;
  userIdentity: string;
  verifyIdentity: string;
  proofType: string;
  source: string;
};
export const attestForAnt = (data: ATTESTFORANTPARAMS, config: any) => {
  return request({
    method: 'post',
    url: `/kyc/ant/proof/issue`,
    data,
    config,
  });
};
export const validateAttestationForAnt = (data: object, config: any) => {
  return request({
    method: 'post',
    url: `/kyc/ant/proof/verify`,
    data,
    config,
  });
};


export const regenerateAttestation = (data: any, config?: any) => {
  return request({
    method: 'post',
    url: `/credential/re-generate?newSigFormat=${data?.newSigFormat}`,
    data,
    config,
  });
};
