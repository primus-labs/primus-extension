import request from '@/utils/request';

type GETEVENTSINGNATURE = {
  rawParam: any;
  greaterThanBaseValue: boolean;
  signature: string;
};
type GETNFTINFO = string
export const getEventSignature = (data: GETEVENTSINGNATURE) => {
  return request({
    method: 'post',
    url: `/event/sign`,
    data,
  });
};

export const getNFTInfo = (data: GETNFTINFO) => {
  return request({
    method: 'get',
    url: data,
  });
};
