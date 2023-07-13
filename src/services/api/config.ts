import request from '@/utils/request';

export const getSysConfig = () => {
  return request({
    method: 'get',
    url: '/public/system/config',
  });
};

export const getProofTypes = () => {
  return request({
    method: 'get',
    url: '/public/cred/types',
  });
};
export const getServerTime = () => {
  return request({
    method: 'get',
    url: '/public/server/time',
  });
};
