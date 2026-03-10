import request from '@/utils/request';

type GETNFTINFO = string;
export const getNFTInfo = (data: GETNFTINFO) => {
  return request({
    method: 'get',
    url: data,
  });
};
