import request from '@/utils/request';

type PhalaCvmListCheckTimeParams = Array<string>;

export const reputationPhalaCvmListCheckTime = (
  phalaCvmListCheckTimeParams?: PhalaCvmListCheckTimeParams
) => {
  return request({
    method: 'post',
    url: '/public/reputation/checkTime',
    data: phalaCvmListCheckTimeParams,
  });
};
