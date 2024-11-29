import request from '@/utils/request';

export const queryTemplateById = async (id: string) => {
  return await request({
    method: 'get',
    url: `/developer-center/public/template/datasources/${id}`,
  });
};
