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
  proofTypes: PROOFTYPEITEM[];
  credentials: CREDENTIALS;
};
