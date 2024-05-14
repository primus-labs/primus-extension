import request from '@/utils/request';
type GETCONNECTANTQRCODEParams = {
  userIdentity: string;
  userPublicKey: string;
};
type GETCONNECTANTRESULTParams = {
  orderId: string;
};
type GETASSETSONCHAINSParams = {
  signature: string;
  timestamp: string;
  address: string;
};
type SENDREQUESTASSETSONCHAINSParams = {
  signature: string;
  timestamp: string;
  address: string;
  type: string;
  chains?: string;
};
type REQUESTASSETSONCHAINSParams = {
  type: string;
  address: string;
};
type GETTOKENPRICEParams = {
  currency: string;
  source: string;
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

export const getConnectAntResult = (
  data: GETCONNECTANTRESULTParams,
  config: any
) => {
  return request({
    method: 'get',
    url: `/kyc/ant/credential/status?orderId=${data.orderId}`,
    config,
  });
};

export const getSupportedQueryableChains = () => {
  return request({
    method: 'get',
    url: `/public/chains/support`,
  });
};

export const getAssetsOnChains = (
  data: GETASSETSONCHAINSParams,
  config?: any
) => {
  return request({
    method: 'get',
    url: `/chain/token?signature=${data.signature}&timestamp=${data.timestamp}&address=${data.address}`,
    config,
  });
};
export const sendRequestAssetsOnChains = (
  data: SENDREQUESTASSETSONCHAINSParams
) => {
  return request({
    method: 'get',
    url: `/chain/assets/request?signature=${data.signature}&timestamp=${data.timestamp}&address=${data.address}&type=${data.type}`,
  });
};
export const requestAssetsOnChains = (data: REQUESTASSETSONCHAINSParams) => {
  return request({
    method: 'get',
    url: `/chain/assets/result?type=${data.type}&address=${data.address}`,
  });
};

export const getTokenPrice = (data: GETTOKENPRICEParams) => {
  return request({
    method: 'get',
    url: `/public/curency/price?currency=${data.currency}&source=${data.source}`,
  });
};
