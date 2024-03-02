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
  id: string;
};
type rewardsDialogVisibleType = {
  visible: boolean;
  tab?: string;
};

type loadingStatus = 0 | 1 | 2; // 0: unstart 1:start loading 2:end

type activeAttestationRequest = {
  dataSourceId?: string;
  verificationContent?: string;
  verificationValue?: string;
  attestationType?: string; // 'Assets Certificate'
  fetchType?: string; // Web ,API
  loading?: loadingStatus;
  presets?: any; // attest params
  // requestId?: string;
  account?: string;
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
  connectByAPILoading: loadingStatus;
  lastLoginHasPwd: boolean; // if has set password
  dataSourceQueryStr: string;
  dataSourceQueryType: string | number;
  connectedWallets: any;
  attestLoading: loadingStatus;
  activeAttestation: activeAttestationRequest;
  attestationQueryStr: string;
  attestationQueryType: string | number;
};
