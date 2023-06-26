import request from '@/utils/request';
type GETCONNECTPOLYGONIDQRCODEParams = {
  sessionId: string;
};
type GETCONNECTPOLYGONIDRESULTParams = {
  sessionId: string;
  type: 'connection' | 'claim';
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
    url: `/polygon/claim`,
    data,
    config,
  });
};
