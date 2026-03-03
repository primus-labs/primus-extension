import request from '@/utils/request';
type PhalaCvmListCheckTimePatams = Array<string>
export const reputationPhalaCvmListCheckTime = (phalaCvmListCheckTimePatams?: PhalaCvmListCheckTimePatams) => {
  return request({
    method: 'post',
    url: '/public/reputation/checkTime',
    data: phalaCvmListCheckTimePatams
  });
};
