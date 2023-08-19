import request from '@/utils/request';

export const getAlgoUrl = async () => {
    return request({
      method: 'get',
      url: `/public/algo/nodes`,
    });
};