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
type attestationLoadingStatus = 0 | 1 | 2 | 3; // 0: unstart 1:start loading 2:suc 3: fail

type activeAttestationRequest = {
  dataSourceId: string;
  verificationContent?: string;
  verificationValue?: string;
  attestationType: string; // 'Assets Verification'
  fetchType?: string; // Web ,API
  loading?: attestationLoadingStatus; // 0: unstart 1:start loading 2:suc 3: fail
  presets?: any; // attest params
  // requestId?: string;
  account?: string;
  msgObj?: any;
};
type activeConnectDataSourceRequest = {
  dataSourceId?: string;
  loading?: 0 | 1 | 2 | 3; // 0: unstart 1:start loading 2:suc 3: fail
  account?: string;
};
type activeOnChainRequest = {
  requestid?: string;
  loading?: 0 | 1;
};
type activeConnectWalletRequest = {
  network?: any;
  loading?: 0 | 1; // TODO-newui0
};
type Msg = {
  id: string;
  type: string; // 'suc'|'error'|'warn'|'info'
  title: string;
  desc?: string;
  code?: string;
  link?: string;
  linkText?: string;
  done?: boolean;
};
type MsgMap = {
  [propName: string]: Msg;
};
type NFT = {
  [propName: string]: {
    name: string;
    collectionName: string;
    imageUri: string;
    chain: string;
  };
};
type NftsMap = {
  [propName: string]: NFT;
};
type SourceUpdateInfo = {
  lastUpdateFromNow: number;
  lastUpdating: boolean;
  pollingFlag: boolean;
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
  sourceUpdateInfo: SourceUpdateInfo;

  proofTypes: PROOFTYPEITEM[];
  webProofTypes: any[];
  credentials: CREDENTIALS;
  userInfo: UserInfoType;
  walletAddress: string;
  rewards: Rewards;
  effective: boolean;
  onChainAssetsSources: onChainAssetsDatas;
  connectWalletDialogVisible: number; // 0| 1| 2
  activeConnectWallet: activeConnectWalletRequest;
  requireFetchAssets: boolean;
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
  activeConnectDataSource: activeConnectDataSourceRequest;
  connectedWallets: any;

  attestLoading: attestationLoadingStatus;
  activeAttestation: activeAttestationRequest;
  attestationQueryStr: string;
  attestationQueryType: string | number;
  activeOnChain: activeOnChainRequest;
  msgs: MsgMap;
  nfts: NftsMap;
};
