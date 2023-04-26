import request from '@/utils/request';

export const getSysConfig = () => {
  return request({
    method: 'get',
    url: '/public/system/config',
  });
};
