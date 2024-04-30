import request from '@/utils/request';

type CheckLotteryResultsParams = {
  event?: string;
};
type GETUNISWAPPROOFPARAMS = {
  signature: string;
  address: string;
  timestamp: string;
  transactionHash: string;
  addressId: string;
};
type GETUNINFTPROOFRESULTPARAMS = { requestId: string };
type CLAIMUNINFTPARAMS = {
  requestId: string;
  signature: string;
  address: string;
  timestamp: string;
};
type GETEVENTSINGNATURE = {
  rawParam: any;
  greaterThanBaseValue: boolean;
  signature: string;
};
type GETNFTINFO = string;
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

export const claimUniNFT = (data: CLAIMUNINFTPARAMS) => {
  return request({
    method: 'post',
    url: `/celer/nft/request?requestId=${data.requestId}`,
    data,
  });
};
export const getUniNFTResult = (data: GETUNINFTPROOFRESULTPARAMS) => {
  return request({
    method: 'get',
    url: `/celer/nft/result?requestId=${data.requestId}`,
  });
};
export const getUniswapProof = (data: GETUNISWAPPROOFPARAMS) => {
  return request({
    method: 'post',
    url: `/celer/nft/sign`,
    data,
  });
};

export const checkLotteryResults = (data: CheckLotteryResultsParams) => {
  return request({
    method: 'get',
    url: `/event/reward/check`,
    data,
  });
};

export const queryBadgeEventPeriod = (data?: CheckLotteryResultsParams) => {
  return request({
    method: 'get',
    url: `/event/time`,
    data,
  });
};

export const queryEventDetail = (data?: CheckLotteryResultsParams) => {
  return request({
    method: 'get',
    url: `/event/detail`,
    data,
  });
};
export const checkEarlyBirdNFT = () => {
  return request({
    method: 'get',
    url: `/event/early-bird/check`,
  });
};
