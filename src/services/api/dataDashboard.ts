import request from '@/utils/request';

type GetOnChainNFTsParams = {
  signature?: string;
  timestamp?: string;
  address?: string;
  chains?: string;
};

export const getOnChainNFTs = (data?: GetOnChainNFTsParams) => {
  return request({
    method: 'get',
    url: `/chain/nft`,
    data,
  });
};
