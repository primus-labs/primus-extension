import request from '@/utils/request';
type GETCONNECTANTQRCODEParams = {
  userIdentity: string;
};
type GETCONNECTANTRESULTParams = {
  orderId: string;
};


export const getConnectAntQrcode = (
  data: GETCONNECTANTQRCODEParams,
  config: any
) => {
  return request({
    method: 'get',
    url: `/kyc/ant/credential/qrcode?userIdentity=${data.userIdentity}`,
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
