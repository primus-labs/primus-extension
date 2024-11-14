const packageJson = require('../../package.json');
import iconTool1 from '@/assets/img/iconTool1.svg';
import iconPolygonID from '@/assets/img/iconPolygonID.svg';
import iconPolygon from '@/assets/img/iconPolygon.png';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconOptimism from '@/assets/img/iconOptimism.svg';
import iconWalletCoinbaseWallet from '@/assets/img/iconWalletCoinbaseWallet.svg';
import iconWalletTrustWallet from '@/assets/img/iconWalletTrustWallet.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
import iconWalletWalletConnect from '@/assets/img/iconWalletWalletConnect.svg';
import iconWalletTokenPocket from '@/assets/img/iconWalletTokenPocket.svg';
import iconMina from '@/assets/img/iconMina.png';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceX.svg';
import iconDataSourceOKX from '@/assets/img/iconDataSourceOKX.svg';
import iconDataSourceKucoin from '@/assets/img/iconDataSourceKucoin.svg';
import iconDataSourceCoinbase from '@/assets/img/iconDataSourceCoinbase.png';
import iconDataSourceHuobi from '@/assets/img/iconDataSourceHuobi.svg';
import iconDataSourceHuobiWithCircle from '@/assets/img/iconDataSourceHuobiWithCircle.svg';
import iconDataSourceGate from '@/assets/img/iconDataSourceGate.svg';
import iconDataSourceBitget from '@/assets/img/iconDataSourceBitget.svg';
import iconDataSourceBybit from '@/assets/img/iconDataSourceBybit.svg';
import iconDataSourceMEXC from '@/assets/img/iconDataSourceMEXC.png';
import iconDataSourceGithub from '@/assets/img/iconDataSourceGithub.png';
import iconDataSourceDiscord from '@/assets/img/iconDataSourceDiscord.png';
import iconDataSourceYoutube from '@/assets/img/iconDataSourceYoutube.svg';
import iconDataSourceZan from '@/assets/img/iconDataSourceZan.svg';
import iconDataSourceOnChainAssets from '@/assets/img/iconDataSourceOnChainAssets.svg';
import Binance from '@/services/webdata/webexchange/webbinance';
import WebBitGet from '@/services/webdata/webexchange/webbitget';
// import OKX from '@/services/exchange/okx';
import OKX from '@/services/webdata/webexchange/webokx';
import KuCoin from '@/services/exchange/kucoin';
import Coinbase from '@/services/exchange/coinbase';
import Huobi from '@/services/exchange/huobi';
import Gate from '@/services/exchange/gate';
import WebGate from '@/services/webdata/webexchange/webgateio';
import WebHuoBi from '@/services/webdata/webexchange/webhuobi';
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
import iconChainEthereum from '@/assets/img/iconUpChainEthereum.png';

import type { ExchangeMeta } from '@/types/dataSource';

export type DataSourceMapType = {
  [propName: string]: ExchangeMeta;
};
export type WALLETITEMTYPE = {
  icon: any;
  name: string;
  disabled?: boolean;
};

export const ExchangeStoreVersion = '1.0.1';
export const SocailStoreVersion = '1.0.1';
export const KYCStoreVersion = '1.0.0';
export const padoExtensionVersion = packageJson.version;
export const CredVersion = '1.0.5';

export const USDT = 'USDT';
export const USD = 'USD';
export const USDC = 'USDC';
export const DAI = 'DAI';
export const BUSD = 'BUSD';
export const TUSD = 'TUSD';
export const BTC = 'BTC';
export const LDO = 'LDO';
export const BETH = 'BETH';
export const STABLETOKENLIST = [USDT, USD, USDC, DAI, BUSD, TUSD];
export const ONESECOND = 1000;
export const ONEMINUTE = 60 * ONESECOND;
export const ATTESTATIONPOLLINGTIME = 3 * ONESECOND;
export const ATTESTATIONPOLLINGTIMEOUT = 20 * ONEMINUTE;
export const STARTOFFLINETIMEOUT = 3 * ONEMINUTE + '';
export const DEFAULTDATASOURCEPOLLINGTIMENUM = '10';
// export const DEFAULTFETCHTIMEOUT = 10 * ONESECOND;
export const DEFAULTFETCHTIMEOUT = 1 * ONEMINUTE;
export const BIGZERO = new BigNumber(0);

export const DATASOURCEMAP: DataSourceMapType = {
  onChain: {
    name: 'On-chain',
    type: 'Assets',
    icon: iconDataSourceOnChainAssets,
  },
  binance: {
    name: 'Binance',
    type: 'Assets',
    icon: iconDataSourceBinance,
    constructorF: Binance,
    baseName: 'api.binance.com',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',
  },
  coinbase: {
    name: 'Coinbase',
    type: 'Assets',
    icon: iconDataSourceCoinbase,
    requirePassphase: false,
    constructorF: Coinbase,
    baseName: 'api.coinbase.com',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',
  },
  kucoin: {
    name: 'KuCoin',
    type: 'Assets',
    icon: iconDataSourceKucoin,
    requirePassphase: true,
    constructorF: KuCoin,
    baseName: 'api.kucoin.com',
  },
  bybit: {
    name: 'Bybit',
    type: 'Assets',
    icon: iconDataSourceBybit,
    requirePassphase: false,
    constructorF: Bybit,
    baseName: 'api.bybit.com',
  },
  okx: {
    name: 'OKX',
    type: 'Assets',
    icon: iconDataSourceOKX,
    requirePassphase: true,
    constructorF: OKX,
    baseName: 'www.okx.com',

    accountBalanceUrl: 'https://www.okx.com/api/v5/account/balance',
  },
  gate: {
    name: 'Gate',
    type: 'Assets',
    icon: iconDataSourceGate,
    requirePassphase: false,
    constructorF: WebGate,
    baseName: 'www.gate.io',
    accountBalanceUrl: 'https://www.gate.io/zh/myaccount/myfunds/spot',
  },
  huobi: {
    name: 'Huobi',
    type: 'Assets',
    icon: iconDataSourceHuobi,
    iconWithCircle: iconDataSourceHuobiWithCircle,
    requirePassphase: false,
    constructorF: WebHuoBi,
    baseName: 'api.huobi.pro',
  },
  bitget: {
    name: 'Bitget',
    type: 'Assets',
    icon: iconDataSourceBitget,
    requirePassphase: true,
    constructorF: WebBitGet,
    baseName: 'www.bitget.com',
    accountBalanceUrl: 'https://www.bitget.com/v1/mix/assetsV2',
  },
  mexc: {
    name: 'MEXC',
    type: 'Assets',
    icon: iconDataSourceMEXC,
    requirePassphase: false,
    constructorF: Mexc,
    baseName: 'api.mexc.com',
  },
  x: {
    name: 'X',
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
  /*youtube: {
    name: 'Youtube',
    type: 'Social',
    icon: iconDataSourceYoutube,
  },*/
  zan: {
    name: 'ZAN',
    type: 'Identity',
    icon: iconDataSourceZan,
    // desc: 'by Antchain',
    disabled: true,
  },
};
export const WALLETLIST: WALLETITEMTYPE[] = [
  {
    icon: iconWalletMetamask,
    name: 'MetaMask',
  },
  {
    icon: iconWalletWalletConnect,
    name: 'WalletConnect',
    disabled: true,
  },
  {
    icon: iconWalletCoinbaseWallet,
    name: 'CoinbaseWallet',
    disabled: true,
  },
  {
    icon: iconWalletTokenPocket,
    name: 'TokenPocket',
    disabled: true,
  },

  // {
  //   icon: iconWalletTrustWallet,
  //   name: 'TrustWallet',
  //   disabled: true,
  // },
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

export const SUPPORRTEDQUERYCHAINMAP = {
  'Arbitrum One': {
    name: 'Arbitrum One',
    chainId: 42161,
    icon: iconArbitrum,
  },
  BSC: {
    name: 'BSC',
    chainId: 56,
    icon: iconBinance,
  },
  Ethereum: {
    name: 'Ethereum',
    chainId: 1,
    icon: iconChainEthereum,
  },
  Polygon: {
    name: 'Polygon',
    chainId: 137,
    icon: iconPolygon,
  },
  Avalanche: {
    name: 'Avalanche',
    chainId: 43114,
    icon: iconNetwork6,
  },
  Optimism: {
    name: 'Optimism',
    chainId: 10,
    icon: iconOptimism,
  },
};
export const schemaTypeMap = {
  ASSETS_PROOF: 'Assets Proof',
  TOKEN_HOLDINGS: 'Token Holdings',
  IDENTIFICATION_PROOF: 'IDENTIFICATION_PROOF',
};

export const supportAttestDataSourceNameList = [
  'Binance',
  'Coinbase',
  'OKX',
  'ZAN',
];
export const BADGELOTTRYTIMESTR = '2023-10-29 12:00:00';
export const SCROLLEVENTNAME = 'SCROLL_LAUNCH_CAMPAIGN';
export const BASEVENTNAME = 'BAS_EVENT_PROOF_OF_HUMANITY';
export const ETHSIGNEVENTNAME = 'SIGNX_X_PROGRAM';
export const LINEAEVENTNAME = 'LINEA_DEFI_VOYAGE';
// schemauid: 0x07656ef97ae97711b79c9e79b3e0409712a8bb9bf26f3495ad15f48cdd49cfac
// schemaType: BAS_EVENT_PROOF_OF_HUMANITY
export const GOOGLEWEBPROOFID = '100';
