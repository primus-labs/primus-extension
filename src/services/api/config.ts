import request from '@/utils/request';

type GETPROOFTYPESParams = {
  type: string;
};

export const getSysConfig = () => {
  return request({
    method: 'get',
    url: '/public/system/config',
  });
};

export const getProofTypes = (data?: GETPROOFTYPESParams) => {
  const formateType = data?.type ?? 'api_cred';
  return request({
    method: 'get',
    url: `/public/cred/types?type=${formateType}`,
  });
};
export const getServerTime = () => {
  return request({
    method: 'get',
    url: '/public/server/time',
  });
};
type GETNotificationsParams = {
  fromId?: string;
  limit: number;
  direction?: 'PREV' | 'NEXT';
};
export const getNotifications = (data?: GETNotificationsParams) => {
  return request({
    method: 'get',
    url: '/public/notifications',
    data,
  });
};
