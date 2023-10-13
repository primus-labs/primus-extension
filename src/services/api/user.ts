import request from '@/utils/request';
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
type RC = 0 | 1; //response code, 0:success, 1:error
interface RequestRes {
  mc: string; // message code
  msg: string; // message to show in website
  rc: RC;
  result: any;
}
export type AuthSourcesItem = {
  id: string;
  logoUrl: string;
  name: string;
  enabled: string;
}
export type AuthSourcesItems = AuthSourcesItem[]
type GetAllOAuthSourcesRes = {
  mc: string;
  msg: string;
  rc: RC;
  result: AuthSourcesItem[];
}
type RequestAuthorizationParams = {
  source: string;
  state: string;
}
type CheckIsLoginParams = {
  state: string;
  source: string;
  data_type: string;
}
type CheckIsLoginRes = {
  mc: string;
  msg: string;
  rc: RC;
  result: {
    state: string;
    createdTime: string;
    email: string;
    id: string; //	User primary key	integer(int64)	
    location: string;//	User location when login with oauth2.0	string	
    nickName: string;
    payloadMap: object;			
    remark: string;
    source: string;
    token: string;
    uniqueId: string;//	User unique id	string	
    updatedTime: string;
    userName: string;
  }
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
export const checkIsLogin = (params: CheckIsLoginParams, config: any) => {
  return request({
    method: 'get',
    url: `/public/oauth/check`,
    data: params,
    config,
  });
};

// Bind user and wallet address
export const bindUserAddress = (data:BindUserAddressParams, config:any) => {
  return request({
    method: 'post',
    url: `/oauth/wallet`,
    data,
    config
  });
};

// refresh social data (x,google)
export const refreshAuthData = (data:RefreshAuthDataParams) => {
  return request({
    method: 'get',
    url: `/public/data/refresh`,
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