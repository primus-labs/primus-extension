import { customFetch2 } from '../utils/request';
export const extraRequestFn2 = async (params) => {
  try {
    const { ...requestParams } = params;
    const requestRes = await customFetch2(requestParams);
    if (typeof requestRes === 'object' && requestRes !== null) {
      return requestRes;
    }
  } catch (e) {
    console.log('fetch custom request error', e);
  }
};


