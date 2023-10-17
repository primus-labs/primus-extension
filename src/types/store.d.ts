import type { UserInfoType } from './user';
import type { PROOFTYPEITEM, CREDENTIALS } from './cred';
import type { ExDatas, SocialDatas, onChainAssetsDatas } from './dataSource';
import type { SysConfigInfo } from './config';
import type { Rewards } from './event';
type ConnectedWallet = {
  address: string;
  provider: any
}
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
};
