import request from '@/utils/request';

type GrtUserIdentityParams = {
  signature: string;
  timestamp: string;
  address: string;
};

export const getUserIdentity = (data: GrtUserIdentityParams) => {
  return request({
    method: 'get',
    url: `/public/pado/identity`,
    data,
  });
};