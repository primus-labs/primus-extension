import request from '@/utils/request';

type GETEVENTSINGNATURE = {
  rawParam: any;
  greaterThanBaseValue: boolean;
  signature: string;
};
export const getEventSignature = (data: GETEVENTSINGNATURE) => {
  return request({
    method: 'post',
    url: `/event/sign`,
    data,
  });
};
