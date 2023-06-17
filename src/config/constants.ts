import iconTool1 from '@/assets/img/iconTool1.svg';
import iconPolygon from '@/assets/img/iconPolygon.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconOptimism from '@/assets/img/iconOptimism.svg';
import iconWalletCoinbaseWallet from '@/assets/img/iconWalletCoinbaseWallet.svg';
import iconWalletTrustWallet from '@/assets/img/iconWalletTrustWallet.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
import iconWalletWalletConnect from '@/assets/img/iconWalletWalletConnect.svg';
import iconWalletTokenPocket from '@/assets/img/iconWalletTokenPocket.svg';
import iconMina from '@/assets/img/iconMina.png';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceOKX from '@/assets/img/iconDataSourceOKX.svg';
import iconDataSourceKucoin from '@/assets/img/iconDataSourceKucoin.svg';
import iconDataSourceCoinbase from '@/assets/img/iconDataSourceCoinbase.svg';
import iconDataSourceHuobi from '@/assets/img/iconDataSourceHuobi.svg';
import iconDataSourceGate from '@/assets/img/iconDataSourceGate.svg';
import iconDataSourceBitget from '@/assets/img/iconDataSourceBitget.svg';
import iconDataSourceBybit from '@/assets/img/iconDataSourceBybit.svg';
import iconDataSourceMEXC from '@/assets/img/iconDataSourceMEXC.svg';
import iconDataSourceGithub from '@/assets/img/iconDataSourceGithub.png';
import iconDataSourceDiscord from '@/assets/img/iconDataSourceDiscord.svg';
import iconDataSourceYoutube from '@/assets/img/iconDataSourceYoutube.svg';
import Binance from '@/services/exchange/binance';
import OKX from '@/services/exchange/okx';
import KuCoin from '@/services/exchange/kucoin';
import Coinbase from '@/services/exchange/coinbase';
import Huobi from '@/services/exchange/huobi';
import Gate from '@/services/exchange/gate';
import Bitget from '@/services/exchange/bitget';
import Bybit from '@/services/exchange/bybit';
import Mexc from '@/services/exchange/mexc';
import BigNumber from 'bignumber.js';
import iconETH from '@/assets/img/iconETH.svg';
import iconBinance from '@/assets/img/iconBinance.png';
import iconNetwork3 from '@/assets/img/iconNetwork3.png';
import iconNetwork4 from '@/assets/img/iconNetwork4.svg';
import iconNetwork5 from '@/assets/img/iconNetwork5.png';
import iconNetwork6 from '@/assets/img/iconNetwork6.png';

export type ExchangeMeta = {
  name: string;
  type: 'Social' | 'Assets';
  icon: any;
  requirePassphase?: boolean;
  constructorF?: any;
  baseName?: string;
  baseUrl?: string;
  accountBalanceUrl?: string; // TODO
  userId?: string;
  label?: string;
};
export type DataSourceMapType = {
  [propName: string]: ExchangeMeta;
};
export const DATASOURCEMAP: DataSourceMapType = {
  binance: {
    name: 'Binance',
    type: 'Assets',
    icon: iconDataSourceBinance,
    constructorF: Binance,
    baseName: 'api.binance.com',
    baseUrl: '18.65.175.124:443',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',
  },
  coinbase: {
    name: 'Coinbase',
    type: 'Assets',
    icon: iconDataSourceCoinbase,
    requirePassphase: false,
    constructorF: Coinbase,
    baseName: 'api.coinbase.com',
    baseUrl: '',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',
  },
  kucoin: {
    name: 'KuCoin',
    type: 'Assets',
    icon: iconDataSourceKucoin,
    requirePassphase: true,
    constructorF: KuCoin,
    baseName: 'api.kucoin.com',
    baseUrl: '',
  },
  bybit: {
    name: 'Bybit',
    type: 'Assets',
    icon: iconDataSourceBybit,
    requirePassphase: false,
    constructorF: Bybit,
    baseName: 'api.bybit.com',
    baseUrl: '',
  },
  okx: {
    name: 'OKX',
    type: 'Assets',
    icon: iconDataSourceOKX,
    requirePassphase: true,
    constructorF: OKX,
    baseName: 'www.okx.com',
    baseUrl: '104.18.2.151:443',

    accountBalanceUrl: 'https://www.okx.com/api/v5/account/balance',
  },
  gate: {
    name: 'Gate',
    type: 'Assets',
    icon: iconDataSourceGate,
    requirePassphase: false,
    constructorF: Gate,
    baseName: 'api.gateio.ws',
    baseUrl: '',
  },
  huobi: {
    name: 'Huobi',
    type: 'Assets',
    icon: iconDataSourceHuobi,
    requirePassphase: false,
    constructorF: Huobi,
    baseName: 'api.huobi.pro',
    baseUrl: '',
  },
  bitget: {
    name: 'Bitget',
    type: 'Assets',
    icon: iconDataSourceBitget,
    requirePassphase: true,
    constructorF: Bitget,
    baseName: 'api.bitget.com',
    baseUrl: '',
  },
  mexc: {
    name: 'MEXC',
    type: 'Assets',
    icon: iconDataSourceMEXC,
    requirePassphase: false,
    constructorF: Mexc,
    baseName: 'api.mexc.com',
    baseUrl: '',
  },
  twitter: {
    name: 'Twitter',
    type: 'Social',
    icon: iconDataSourceTwitter,
  },
  github: {
    name: 'Github',
    type: 'Social',
    icon: iconDataSourceGithub,
  },
  discord: {
    name: 'Discord',
    type: 'Social',
    icon: iconDataSourceDiscord,
  },
  youtube: {
    name: 'Youtube',
    type: 'Social',
    icon: iconDataSourceYoutube,
  },
};

export const CHARTCOLORS = [
  '#00CDFF',
  '#00F0DC',
  '#00D7C8',
  '#2864E1',
  '#335BEB',
  '#8741E1',
  '#D663D9',
  '#5DD8BA',
  '#6FD85D',
  '#BFD85D',
  '#EDC45A',
  '#ED8F5A',
];

export const ExchangeStoreVersion = '1.0.0';
export const SocailStoreVersion = '1.0.0';
export const padoExtensionVersion = '0.1.5';
export const CredVersion = '1.0.0';

export const USDT = 'USDT';
export const USD = 'USD';
export const USDC = 'USDC';
export const DAI = 'DAI';
export const BUSD = 'BUSD';
export const TUSD = 'TUSD';
export const BTC = 'BTC';
export const LDO = 'LDO';
export const STABLETOKENLIST = [USDT, USD, USDC, DAI, BUSD, TUSD];

export type WALLETITEMTYPE = {
  icon: any;
  name: string;
  disabled?: boolean;
};
export const WALLETLIST: WALLETITEMTYPE[] = [
  {
    icon: iconWalletMetamask,
    name: 'Metamask',
  },
  {
    icon: iconWalletWalletConnect,
    name: 'WalletConnect',
    disabled: true,
  },
  {
    icon: iconWalletTokenPocket,
    name: 'TokenPocket',
    disabled: true,
  },
  {
    icon: iconWalletCoinbaseWallet,
    name: 'CoinbaseWallet',
    disabled: true,
  },
  {
    icon: iconWalletTrustWallet,
    name: 'TrustWallet',
    disabled: true,
  },
];
export const ONESECOND = 1000;
export const ONEMINUTE = 60 * ONESECOND;
export const ATTESTATIONPOLLINGTIME = 5 * ONESECOND;
export const DEFAULTDATASOURCEPOLLINGTIMENUM = '3';
export const BIGZERO = new BigNumber(0);

export const DEFAULTCREDTYPELIST = [
  {
    id: '1',
    credIdentifier: 'ASSETS_PROOF',
    credTitle: 'Assets Proof',
    credIntroduce: 'Proving deposit amount',
    credLogoUrl:
      'https://xuda-note.oss-cn-shanghai.aliyuncs.com/others/iconAssetsProof.svg',
    credDetails:
      'Proving you have a certain amount of assets, which may come from bank deposits or from a crypto exchange balance. PADO uses TLS-MPC to verify the authenticity of your data.',
    credProofContent: 'Balance of assets',
    credProofConditions: '["1000"]',
    display: 0,
    enabled: 0,
    simplifiedName: 'Asset',
  },
  {
    id: '2',
    credIdentifier: 'TOKEN_HOLDINGS',
    credTitle: 'Token Holdings',
    credIntroduce: 'Proving ownership of a kind of Token',
    credLogoUrl:
      'https://xuda-note.oss-cn-shanghai.aliyuncs.com/others/iconTokenHoldings.svg',
    credDetails:
      'Proof that you hold a certain kind of TOKEN. PADO uses TLS-MPC to validate your data authenticity.',
    credProofContent: 'Hold this kind of Token',
    credProofConditions: '["USDT","LAT"]',
    display: 0,
    enabled: 0,
    simplifiedName: 'Token',
  },
  {
    id: '3',
    credIdentifier: 'QUALIFICATIONS',
    credTitle: 'Qualifications',
    credIntroduce: 'Proving identity or membership',
    credLogoUrl:
      'https://xuda-note.oss-cn-shanghai.aliyuncs.com/others/iconQualifications.svg',
    credDetails: 'xxx',
    credProofContent: 'xxx',
    credProofConditions: 'xxx',
    display: 0,
    enabled: 1,
    simplifiedName: 'Qualification',
  },
];
export const DEFAULTAUTHSOURCELIST = [
  {
    id: '1',
    logoUrl:
      'https://xuda-note.oss-cn-shanghai.aliyuncs.com/note/iconGoogle.svg',
    name: 'GOOGLE',
    enabled: '0',
  },
  {
    id: '2',
    logoUrl:
      'https://xuda-note.oss-cn-shanghai.aliyuncs.com/note/iconTwitter.svg',
    name: 'TWITTER',
    enabled: '0',
  },
  {
    id: '3',
    logoUrl:
      'https://xuda-note.oss-cn-shanghai.aliyuncs.com/note/iconGithub.png',
    name: 'GITHUB',
    enabled: '0',
  },
  {
    id: '4',
    logoUrl:
      'https://xuda-note.oss-cn-shanghai.aliyuncs.com/note/iconDiscord.svg',
    name: 'DISCORD',
    enabled: '0',
  },
];

export const CHAINNETWORKLIST = [
  {
    icon: iconETH,
    title: 'ETH',
  },
  {
    icon: iconBinance,
    title: 'Binance',
  },
  {
    icon: iconNetwork3,
    title: '3',
  },
  {
    icon: iconNetwork4,
    title: '4',
  },
  {
    icon: iconNetwork5,
    title: '5',
  },
  {
    icon: iconNetwork6,
    title: '6',
  },
];