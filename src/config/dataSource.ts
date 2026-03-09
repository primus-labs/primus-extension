
import Binance from '@/services/webdata/webexchange/webbinance';

import OKX from '@/services/webdata/webexchange/webokx';
import KuCoin from '@/services/exchange/kucoin';
import Coinbase from '@/services/exchange/coinbase';
import Huobi from '@/services/exchange/huobi';
import Gate from '@/services/exchange/gate';
import Bitget from '@/services/exchange/bitget';
import WebBitGet from '@/services/webdata//webexchange/webbitget';
import Bybit from '@/services/exchange/bybit';
import Mexc from '@/services/exchange/mexc';
import WebTikTok from '@/services/webdata/websocial/webtiktok';
import type { ExchangeMeta, DataSourceMapType } from '@/types/dataSource';
import Webgateio from '@/services/webdata/webexchange/webgateio';
import WebGate from '@/services/webdata/webexchange/webgateio';
import Webhuobi from '@/services/webdata/webexchange/webhuobi';
import WebHuoBi from '@/services/webdata/webexchange/webhuobi';
import WebMexc from '@/services/webdata/webexchange/webmexc';
import WebTwitter from '@/services/webdata/websocial/webtwitter';

export type DataSourceItemType = ExchangeMeta & {
  provider?: any;
  unConnectTip?: any;
  jumpTo?: any;
  connectType?: any;
  showName?: string;
  id: string;
};

export const DATASOURCEMAP: DataSourceMapType = {
  'web3 wallet': {
    id: 'web3 wallet',
    name: 'Web3 Wallet',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching token & NFT assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch token & NFT assets data from your Web3 Wallet to manage your assets or create attestations.',
    connectType: '',
  },
  x: {
    id: 'x',
    name: 'X',
    type: 'Social',
    icon: undefined,
    desc: 'Support fetching tweet & followers data for management and attestation creation.',
    unConnectTip:
      'You can fetch tweet & followers data from your X account to manage your data or create attestations.',
    constructorF: WebTwitter,
    connectType: 'Web',
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    type: 'Social',
    icon: undefined,
    desc: 'Support fetching account name & status data for management and attestation creation.',
    unConnectTip:
      'You can fetch user account name & status data from your Discord account to manage your data or create attestations.',

    connectType: 'Auth',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    type: 'Social',
    icon: undefined,
    desc: 'Support fetching account name & status data for management and attestation creation.',
    unConnectTip:
      'You can fetch account name & status data from your TikTok account to manage your data or create attestations.',
    constructorF: WebTikTok,

    connectType: 'Web',
  },
  binance: {
    id: 'binance',
    name: 'Binance',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching spot & flexible account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot & flexible account assets data from your Binance account to manage your assets or create attestations.',
    constructorF: Binance,
    baseName: 'api.binance.com',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',

    jumpTo: 'https://www.binance.com/my/dashboard',
    connectType: 'Web',
  },
  okx: {
    id: 'okx',
    name: 'OKX',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching trading account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch trading account assets data from your OKX account to manage your data or create attestations.',
    requirePassphase: true,
    constructorF: OKX,
    baseName: 'www.okx.com',

    accountBalanceUrl: 'https://www.okx.com/api/v5/account/balance',
    connectType: 'Web',
  },
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot account assets data from your Coinbase account to manage your data or create attestations.',
    requirePassphase: false,
    constructorF: Coinbase,
    baseName: 'api.coinbase.com',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',

    connectType: 'API',
    hidden: true,
  },
  google: {
    id: 'google',
    name: 'Google Account',
    type: 'Social',
    icon: undefined,
    desc: 'Support fetching account name & email address data for management and attestation creation.',
    unConnectTip:
      'You can fetch account name & email address data from your Google account to manage your data or create attestations.',

    connectType: 'Auth',
    showName: 'Google Account',
  },
  github: {
    id: 'github',
    name: 'Github',
    type: 'Social',
    icon: undefined,
    desc: 'Support fetching user profile data for management and attestation creation.',
    unConnectTip:
      'You can fetch user profile data from your Github account to manage your data or create attestations.',

    connectType: 'Auth',
    hidden: true,
  },
  // bitget: {
  //   id: 'bitget',
  //   name: 'Bitget',
  //   type: 'Assets',
  //   icon: iconDataSourceBitget,
  //   desc: 'Support fetching spot account assets data for management and attestation creation.',
  //   unConnectTip:
  //     'You can fetch spot account data from your Bitget account to manage your data or create attestations.',
  //   requirePassphase: true,
  //   constructorF: WebBitGet,
  //   baseName: 'www.bitget.com',
  //   accountBalanceUrl: 'https://www.bitget.com/v1/mix/assetsV2',
  //   jumpTo: 'https://www.bitget.com/zh-CN/asset/spot',
  //   connectType: 'Web',
  // },
  huobi: {
    id: 'huobi',
    name: 'Huobi',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot account data from your Huobi account to manage your data or create attestations.',
    iconWithCircle: undefined,
    requirePassphase: false,
    constructorF: WebHuoBi,
    baseName: 'www.htx.com',
    accountBalanceUrl:
      'https://www.htx.com/-/x/pro/v1/account/spot-account/balance',
    jumpTo: 'https://www.htx.com/zh-cn/finance/account/spot/',
    connectType: 'Web',
    hidden: true,
  },
  bybit: {
    id: 'bybit',
    name: 'Bybit',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot account data from your Bybit account to manage your data or create attestations.',
    requirePassphase: false,
    // constructorF: Bybit,
    baseName: 'api.bybit.com',

    connectType: 'API',
  },
  kucoin: {
    id: 'kucoin',
    name: 'KuCoin',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot account data from your KuCoin account to manage your data or create attestations.',
    requirePassphase: true,
    constructorF: KuCoin,
    baseName: 'api.kucoin.com',

    connectType: 'API',
    hidden: true,
  },
  gate: {
    id: 'gate',
    name: 'Gate',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot account data from your Gate account to manage your data or create attestations.',
    requirePassphase: false,
    constructorF: WebGate,
    baseName: 'www.gate.io',
    accountBalanceUrl: 'https://www.gate.io/apiw/v2/account/spot/funds',
    jumpTo: 'https://www.gate.io/zh/myaccount/myfunds/spot',
    connectType: 'Web',
    hidden: true,
  },
  mexc: {
    id: 'mexc',
    name: 'MEXC',
    type: 'Assets',
    icon: undefined,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot account data from your MEXC account to manage your data or create attestations.',
    requirePassphase: false,
    constructorF: WebMexc,
    baseName: 'www.mexc.com/',
    accountBalanceUrl:
      'https://www.mexc.com/api/platform/asset/api/asset/spot/convert/v2',
    jumpTo: 'https://www.mexc.com/zh-CN/assets/spot',
    connectType: 'Web',
    hidden: true,
  },
  zan: {
    id: 'zan',
    name: 'ZAN',
    type: 'Identity',
    icon: undefined,
    desc: 'Support fetching basic identity and KYC verification status data for management and attestation creation.',
    unConnectTip:
      'You can fetch basic identity and KYC verification status data from ZAN’s service to manage your data or create attestations.',
    disabled: true,

    connectType: 'API',
    hidden: true,
  },

  /*youtube: {
    id:'youtube',
    name: 'Youtube',
    type: 'Social',
    icon: iconDataSourceYoutube,
  },*/
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    type: 'Social',
    icon: undefined,
    desc: '',
    unConnectTip: '',
    connectType: 'Web',
    hidden: true,
  },
};
export const DATASOURCEMAPVALUES: DataSourceItemType[] =
  Object.values(DATASOURCEMAP);

export const guideMap = {
  binance:
    'https://docs.padolabs.org/Exchanges-API-Setup/Binance-API-Key-Setup',
  coinbase:
    'https://docs.padolabs.org/Exchanges-API-Setup/Coinbase-API-Key-Setup',
  kucoin: 'https://docs.padolabs.org/Exchanges-API-Setup/Kucoin-API-Key-Setup',
  bybit: 'https://docs.padolabs.org/Exchanges-API-Setup/Bybit-API-Key-Setup',
  okx: 'https://docs.padolabs.org/Exchanges-API-Setup/OKX-API-Key-Setup',
  gate: 'https://docs.padolabs.org/Exchanges-API-Setup/Gate-API-Key-Setup',
  huobi: 'https://docs.padolabs.org/Exchanges-API-Setup/Huobi-API-Key-Setup',
  bitget: 'https://docs.padolabs.org/Exchanges-API-Setup/Bitget-API-Key-Setup',
  mexc: 'https://docs.padolabs.org/Exchanges-API-Setup/MEXC-API-Key-Setup',
};

export const SUPPORTATTESTDATASOURCES = [
  // 'web3 wallet',
  'binance',
  'okx',
  'x',
  'tiktok',
  'google',
  'coinbase',
  'bitget',
  'bybit',
  'discord'
];
