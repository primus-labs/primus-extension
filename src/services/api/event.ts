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

type CLAIMUNINFTPARAMS = {
  signature: string;
  address: string;
  timestamp: string;
};
type GETUNINFTPROOFRESULTPARAMS = {
  address: string;
  blockNumber: string;
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
    method: 'get',
    url: `/brevis-network/transaction/proof`,
    data,
    config: {
      timeout: 2 * 60 * 1000,
    },
  });
};
export const getUniNFTResult = (data: GETUNINFTPROOFRESULTPARAMS) => {
  return request({
    method: 'get',
    url: `/brevis-proof/result`,
    data,
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

// Check if participated in the events.
export const checkIfJoinedEvents = (data: CheckLotteryResultsParams) => {
  return request({
    method: 'get',
    url: `/event/check`,
    data,
  });
};
