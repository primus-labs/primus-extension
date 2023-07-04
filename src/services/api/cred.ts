import request from '@/utils/request';
type GETCONNECTPOLYGONIDQRCODEParams = {
  sessionId: string;
};
type GETCONNECTPOLYGONIDRESULTParams = {
  sessionId: string;
  type: string;// 'connection' | 'claim'
};
type GETPOLYGONIDATTESTATIONParams = {
  claimId: string;
}

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
    url: `/polygon/claim?sessionId=${data.sessionId}`,
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

export const attestForAnt = (
  data: object,
  config: any
) => {
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