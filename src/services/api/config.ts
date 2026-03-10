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
