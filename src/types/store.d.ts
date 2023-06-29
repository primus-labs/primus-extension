import type { UserInfoType } from './user';
import type { PROOFTYPEITEM, CREDENTIALS } from './cred';
import type { ExDatas, SocialDatas } from './dataSource';
import type { SysConfigInfo } from './config';

export type UserState = {
  padoServicePort: chrome.runtime.Port;
  sysConfig: SysConfigInfo;
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
