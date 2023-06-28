export type ExDatas = {
  [propName: string]: ExInfo & ExchangeMeta;
};

export type UserState = {
  padoServicePort: chrome.runtime.Port;
  sysConfig: SysConfigInfo;
  exDatas: ExDatas;
  socialDatas: SocialDatas;
  userPassword: string;
  activeSourceType: string;
  filterWord: string;
  exSources: ExDatas;
  socialSources: SocialDatas;
  sourceUpdateFrequency: string;
  proofTypes: PROOFTYPEITEM[];
  credentials: CREDENTIALS;
  userInfo: UserInfoType;
};
