export type UserInfoType = {
  state: string;
  createdTime: string;
  email: string;
  id: string; //	User primary key	integer(int64)
  location: string; //	User location when login with oauth2.0	string
  nickName: string;
  payloadMap: object;
  remark: string;
  source: string;
  token: string;
  uniqueId: string; //	User unique id	string
  updatedTime: string;
  userName: string;
  // userInfo: UserInfoType;
};
