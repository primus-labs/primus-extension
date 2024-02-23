import type { UserInfoType } from './user';
import type { PROOFTYPEITEM, CREDENTIALS } from './cred';
import type { ExDatas, SocialDatas, onChainAssetsDatas } from './dataSource';
import type { SysConfigInfo } from './config';
import type { Rewards } from './event';
type EventDetailType = {
  startTime: string;
  endTime: string;
  ext: any;
};
type EventsType = {
  [propName: string]: EventDetailType;
};
type BadgeEventPeriodType = {
  startTime: string;
  endTime: string;
};
type ConnectedWallet = {
  address: string;
  provider: any;
  name: string;
};
type rewardsDialogVisibleType = {
  visible: boolean;
  tab?: string;
};
export type UserState = {
  padoServicePort: chrome.runtime.Port;
  sysConfig: SysConfigInfo;
  userPassword: string;
  activeSourceType: string;
  filterWord: string;
  exSources: ExDatas;
  socialSources: SocialDatas;
  kycSources: any;
  sourceUpdateFrequency: string;
  proofTypes: PROOFTYPEITEM[];
  webProofTypes: any[];
  credentials: CREDENTIALS;
  userInfo: UserInfoType;
  walletAddress: string;
  rewards: Rewards;
  effective: boolean;
  onChainAssetsSources: onChainAssetsDatas;
  connectWalletDialogVisible: boolean;
  connectedWallet: ConnectedWallet;
  rewardsDialogVisible: rewardsDialogVisibleType;
  badgeEventPeriod: BadgeEventPeriodType;
  scrollEventPeriod: BadgeEventPeriodType;
  events: EventsType;
  theme: 'light' | 'dark';
  connectByAPILoading: number; // 0: unstart 1:start loading 2:end
  lastLoginHasPwd: boolean; // if has set password
};
