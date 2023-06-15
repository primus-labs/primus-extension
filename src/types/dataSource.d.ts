export type ConnectSourceType = {
  name: string;
  icon: any;
  exUserId?: string;
  label?: string;
  type?: string;
};

export type SocialDataSourceData = {
  followers?: number | string;
  posts?: number | string;
  followings?: number | string;
  verified?: boolean;
  userName?: string;
  createdTime?: string;
  screenName?: string;
  remarks?: any;
};

export type SocialDatas = {
  [propName: string]: SocialDataSourceData & ExchangeMeta;
};