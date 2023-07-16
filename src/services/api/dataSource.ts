import request from '@/utils/request';
type GETCONNECTANTQRCODEParams = {
  userIdentity: string;
  userPublicKey: string;
};
type GETCONNECTANTRESULTParams = {
  orderId: string;
};


export const getConnectAntQrcode = (
  data: GETCONNECTANTQRCODEParams,
  config: any
) => {
  const encodePublicKey = encodeURIComponent(data.userPublicKey);
  return request({
    method: 'get',
    url: `/kyc/ant/credential/qrcode?userIdentity=${data.userIdentity}&userPublicKey=${encodePublicKey}`,
    config,
  });
};

export const getConnectAntResult = (data: GETCONNECTANTRESULTParams,config: any) => {
  return request({
    method: 'get',
    url: `/kyc/ant/credential/status?orderId=${data.orderId}`,
    config,
  });
};
