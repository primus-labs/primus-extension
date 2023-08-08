export type ConnectSourceType = {
  name: string;
  icon: any;
  exUserId?: string;
  label?: string;
  type?: string;
  desc?: string;
};

export type TokenMap = {
  symbol: string;
  price: string;
  amount: string;
  value: string;
  logo?: any;
  isNative?: boolean;
  address?: string;
  chain?: string;
};

export type AssetsMap = {
  [propName: string]: TokenMap;
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
export type ExchangeMeta = {
  name: string;
  type: 'Social' | 'Assets' | 'Identity';
  icon: any;
  iconWithCircle?: any;
  requirePassphase?: boolean;
  constructorF?: any;
  baseName?: string;
  accountBalanceUrl?: string; // TODO
  userId?: string;
  label?: string;
  desc?: string;
  disabled?: boolean;
};

type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
  pnl?: string;
  label?: string;
  flexibleAccountTokenMap: AssetsMap;
  spotAccountTokenMap: AssetsMap;
  tokenPriceMap: object;
  tradingAccountTokenAmountObj: object;
  exUserId?: string;
  pnlAmount?: string;
  pnlPercent?: string;
};

export type ExData = ExInfo & ExchangeMeta;
export type ExDatas = {
  [propName: string]: ExData;
};
export type ExDataList = ExData[];

export type SocialData = SocialDataSourceData & ExchangeMeta;
export type SocialDatas = {
  [propName: string]: SocialData;
};
export type SocialDataList = SocialData[];

export type KYCDataSourceData = {
  credential: string;
  transactionHash: string;
  // credentialType;
  // orderId;
  date: string;
  timestamp: number;
  version: string;
};
export type KYCData = KYCDataSourceData & ExchangeMeta;
export type KYCDatas = {
  [propName: string]: KYCData;
};
export type KYCDataList = KYCData[];


export type ChainAssetsMap = {
    totalBalance: string;
    tokenListMap: AssetsMap;
  }
export type ChainsAssetsMap = {
  [propName: string]: ChainAssetsMap;
};
export type onChainData = {
  name: string;
  date: string;
  label?: string;
  address: string;
  signature?: string;

  totalBalance: string;
  tokenListMap: AssetsMap;
  chainsAssetsMap: ChainsAssetsMap;
  pnl?: string;
  timestamp: string;
  // exUserId?: string;
  // pnlAmount?: string;
  // pnlPercent?: string;
};
export type onChainAssetsData = onChainData & ExchangeMeta;
export type onChainAssetsDataList = onChainAssetsData[];

export type onChainAssetsDatas = {
  [propName: string]: onChainAssetsData;
};

export type SourceData = ExData | SocialData | KYCData | onChainData;
export type SourceDataList = (ExData | SocialData | KYCData | onChainData)[];

export type AssetData = onChainAssetsData | exData;
export type AssetDataList = AssetData[];
