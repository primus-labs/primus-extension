import request from '@/utils/request';
type CheckIfBindConnectedWalletParams = {
  address?: string;
};
type BindConnectedWalletParams = {
  signature: string;
  timestamp: string;
  address: string;
  type: string;
};
type GrtUserIdentityParams = {
  signature: string;
  timestamp: string;
  address: string;
};
type RefreshAuthDataParams = {
  userId?:string;
  uniqueId?:string;
  source?:string;
}
export type AuthSourcesItem = {
  id: string;
  logoUrl: string;
  name: string;
  enabled: string;
}
export type AuthSourcesItems = AuthSourcesItem[]
type CheckIsLoginParams = {
  state: string;
  source: string;
  data_type?: string;
}
type BindUserAddressParams = {
  userId: number;
  walletAddress: string;
}

export const getAllOAuthSources = () => {
  return request({
    method: 'get',
    url: '/public/sources',
  });
};



// Check login is finished with state.
export const checkIsLogin = (params: CheckIsLoginParams) => {
  return request({
    method: 'get',
    url: `/oauth2/check`,
    data: params,
  });
};


// refresh social data (x,google)
export const refreshAuthData = (data:RefreshAuthDataParams) => {
  return request({
    method: 'get',
    url: `/oauth2/data/refresh`,
    data
  });
};

export const getUserIdentity = (data: GrtUserIdentityParams) => {
  return request({
    method: 'get',
    url: `/public/pado/identity`,
    data,
  });
};

// bind  metamask wallet user connected
export const bindConnectedWallet = (data: BindConnectedWalletParams) => {
  return request({
    method: 'get',
    url: `/wallet/connect`,
    data,
  });
};

// check if hand bound  metamask wallet user connected
export const checkIfBindConnectedWallet = (data: CheckIfBindConnectedWalletParams) => {
  return request({
    method: 'get',
    url: `/wallet/connect/check`,
    data,
  });
};