import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceOKX from '@/assets/img/iconDataSourceOKX.svg';
import iconDataSourceKucoin from '@/assets/img/iconDataSourceKucoin.svg';
import iconDataSourceCoinbase from '@/assets/img/iconDataSourceCoinbase.svg';
import iconDataSourceHuobi from '@/assets/img/iconDataSourceHuobi.svg';
import iconDataSourceHuobiWithCircle from '@/assets/img/iconDataSourceHuobiWithCircle.svg';
import iconDataSourceGate from '@/assets/img/iconDataSourceGate.svg';
import iconDataSourceBitget from '@/assets/img/iconDataSourceBitget.svg';
import iconDataSourceBybit from '@/assets/img/iconDataSourceBybit.svg';
import iconDataSourceMEXC from '@/assets/img/iconDataSourceMEXC.svg';
import iconDataSourceGithub from '@/assets/img/iconDataSourceGithub.png';
import iconDataSourceDiscord from '@/assets/img/iconDataSourceDiscord.svg';
import iconDataSourceYoutube from '@/assets/img/iconDataSourceYoutube.svg';
import iconDataSourceZan from '@/assets/img/iconDataSourceZan.svg';
import iconDataSourceOnChainAssets from '@/assets/img/iconDataSourceOnChainAssets.svg';
import iconDataSourceGoogle from '@/assets/img/iconGoogle.svg';
import iconDataSourceTikTok from '@/assets/img/iconDataSourceTikTok.svg';

import Binance from '@/services/webdata/webexchange/webbinance';

import OKX from '@/services/webdata/webexchange/webokx';
import KuCoin from '@/services/exchange/kucoin';
import Coinbase from '@/services/exchange/coinbase';
import Huobi from '@/services/exchange/huobi';
import Gate from '@/services/exchange/gate';
import Bitget from '@/services/exchange/bitget';
import Bybit from '@/services/exchange/bybit';
import Mexc from '@/services/exchange/mexc';
import WebTikTok from '@/services/webdata/websocial/webtiktok';
import type { ExchangeMeta, DataSourceMapType } from '@/types/dataSource';

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
    icon: iconDataSourceOnChainAssets,
    desc: 'Support fetching token & NFT assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch token & NFT assets data from your Web3 Wallet to manage your assets or create attestations.',
    connectType: '',
  },
  binance: {
    id: 'binance',
    name: 'Binance',
    type: 'Assets',
    icon: iconDataSourceBinance,
    desc: 'Support fetching spot & flexible account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot & flexible account assets data from your Binance account to manage your assets or create attestations.',
    constructorF: Binance,
    baseName: 'api.binance.com',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',

    jumpTo: 'https://www.binance.com/my/dashboard',
    connectType: 'Web',
  },
  x: {
    id: 'x',
    name: 'X',
    type: 'Social',
    icon: iconDataSourceTwitter,
    desc: 'Support fetching tweet & followers data for management and attestation creation.',
    provider: 'Alex',
    unConnectTip:
      'You can fetch tweet & followers data from your X account to manage your data or create attestations.',

    connectType: 'Auth',
  },
  okx: {
    id: 'okx',
    name: 'OKX',
    type: 'Assets',
    icon: iconDataSourceOKX,
    desc: 'Support fetching trading account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch trading account assets data from your OKX account to manage your data or create attestations.',
    requirePassphase: true,
    constructorF: OKX,
    baseName: 'www.okx.com',

    accountBalanceUrl: 'https://www.okx.com/api/v5/account/balance',
    connectType: 'Web',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    type: 'Social',
    icon: iconDataSourceTikTok,
    desc: 'Support fetching account name & status data for management and attestation creation.',
    unConnectTip:
      'You can fetch account name & status data from your TikTok account to manage your data or create attestations.',
    constructorF: WebTikTok,

    connectType: 'Web',
  },
  google: {
    id: 'google',
    name: 'GOOGLE',

    type: 'Social',
    icon: iconDataSourceGoogle,
    desc: 'Support fetching account name & email address data for management and attestation creation.',
    unConnectTip:
      'You can fetch account name & email address data from your Google account to manage your data or create attestations.',

    connectType: 'Auth',
    showName: 'G Account',
  },
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase',
    type: 'Assets',
    icon: iconDataSourceCoinbase,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot account assets data from your Coinbase account to manage your data or create attestations.',
    requirePassphase: false,
    constructorF: Coinbase,
    baseName: 'api.coinbase.com',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',

    connectType: 'API',
  },
  bitget: {
    id: 'bitget',
    name: 'Bitget',
    type: 'Assets',
    icon: iconDataSourceBitget,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip:
      'You can fetch spot account data from your Bitget account to manage your data or create attestations.',
    requirePassphase: true,
    constructorF: Bitget,
    baseName: 'api.bitget.com',

    connectType: 'API',
  },
  zan: {
    id: 'zan',
    name: 'ZAN',
    type: 'Identity',
    icon: iconDataSourceZan,
    desc: 'Support fetching basic identity and KYC verification status data for management and attestation creation.',
    unConnectTip:
      'You can fetch basic identity and KYC verification status data from ZAN’s service to manage your data or create attestations.',
    disabled: true,

    connectType: 'API',
  },
  github: {
    id: 'github',
    name: 'Github',
    type: 'Social',
    icon: iconDataSourceGithub,
    desc: 'Support fetching user profile data for management and attestation creation.',
    unConnectTip: '',

    connectType: 'API',
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    type: 'Social',
    icon: iconDataSourceDiscord,
    desc: 'Support fetching account name & status data for management and attestation creation.',
    unConnectTip: '',

    connectType: 'Auth',
  },
  bybit: {
    id: 'bybit',
    name: 'Bybit',
    type: 'Assets',
    icon: iconDataSourceBybit,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip: '',
    requirePassphase: false,
    constructorF: Bybit,
    baseName: 'api.bybit.com',

    connectType: 'API',
  },
  huobi: {
    id: 'houbi',
    name: 'Huobi',
    type: 'Assets',
    icon: iconDataSourceHuobi,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip: '',
    iconWithCircle: iconDataSourceHuobiWithCircle,
    requirePassphase: false,
    constructorF: Huobi,
    baseName: 'api.huobi.pro',

    connectType: 'API',
  },

  kucoin: {
    id: 'kucoin',
    name: 'KuCoin',
    type: 'Assets',
    icon: iconDataSourceKucoin,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip: '',
    requirePassphase: true,
    constructorF: KuCoin,
    baseName: 'api.kucoin.com',

    connectType: 'API',
  },
  gate: {
    id: 'gate',
    name: 'Gate',
    type: 'Assets',
    icon: iconDataSourceGate,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip: '',
    requirePassphase: false,
    constructorF: Gate,
    baseName: 'api.gateio.ws',

    connectType: 'API',
  },
  mexc: {
    id: 'mexc',
    name: 'MEXC',
    type: 'Assets',
    icon: iconDataSourceMEXC,
    desc: 'Support fetching spot account assets data for management and attestation creation.',
    unConnectTip: '',
    requirePassphase: false,
    constructorF: Mexc,
    baseName: 'api.mexc.com',

    connectType: 'API',
  },

  /*youtube: {
    id:'youtube',
    name: 'Youtube',
    type: 'Social',
    icon: iconDataSourceYoutube,
  },*/
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
