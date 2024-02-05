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
import Binance from '@/services/exchange/binance';
import OKX from '@/services/exchange/okx';
import KuCoin from '@/services/exchange/kucoin';
import Coinbase from '@/services/exchange/coinbase';
import Huobi from '@/services/exchange/huobi';
import Gate from '@/services/exchange/gate';
import Bitget from '@/services/exchange/bitget';
import Bybit from '@/services/exchange/bybit';
import Mexc from '@/services/exchange/mexc';
import type { ExchangeMeta } from '@/types/dataSource';

export type DataSourceMapType = {
  [propName: string]: ExchangeMeta & { provider?: any };
};

export const DATASOURCEMAP: DataSourceMapType = {
  onChain: {
    name: 'Web3 Wallet',
    type: 'Assets',
    icon: iconDataSourceOnChainAssets,
    desc: 'Support fetching token & NFT assets data for management and attestation creation.',
  },
  binance: {
    name: 'Binance',
    type: 'Assets',
    icon: iconDataSourceBinance,
    desc: 'Support fetching spot & flexible account assets data for management and attestation creation.',

    constructorF: Binance,
    baseName: 'api.binance.com',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',
  },
  coinbase: {
    name: 'Coinbase',
    type: 'Assets',
    icon: iconDataSourceCoinbase,
    desc: 'Support fetching spot account assets data for management and attestation creation.',

    requirePassphase: false,
    constructorF: Coinbase,
    baseName: 'api.coinbase.com',
    accountBalanceUrl: 'https://api.binance.com/api/v3/account',
  },
  kucoin: {
    name: 'KuCoin',
    type: 'Assets',
    icon: iconDataSourceKucoin,
    desc: 'Support fetching spot account assets data for management and attestation creation.',

    requirePassphase: true,
    constructorF: KuCoin,
    baseName: 'api.kucoin.com',
  },
  bybit: {
    name: 'Bybit',
    type: 'Assets',
    icon: iconDataSourceBybit,
    desc: 'Support fetching spot account assets data for management and attestation creation.',

    requirePassphase: false,
    constructorF: Bybit,
    baseName: 'api.bybit.com',
  },
  okx: {
    name: 'OKX',
    type: 'Assets',
    icon: iconDataSourceOKX,
    desc: 'Support fetching trading account assets data for management and attestation creation.',

    requirePassphase: true,
    constructorF: OKX,
    baseName: 'www.okx.com',

    accountBalanceUrl: 'https://www.okx.com/api/v5/account/balance',
  },
  gate: {
    name: 'Gate',
    type: 'Assets',
    icon: iconDataSourceGate,
    desc: 'Support fetching spot account assets data for management and attestation creation.',

    requirePassphase: false,
    constructorF: Gate,
    baseName: 'api.gateio.ws',
  },
  huobi: {
    name: 'Huobi',
    type: 'Assets',
    icon: iconDataSourceHuobi,
    desc: 'Support fetching spot account assets data for management and attestation creation.',

    iconWithCircle: iconDataSourceHuobiWithCircle,
    requirePassphase: false,
    constructorF: Huobi,
    baseName: 'api.huobi.pro',
  },
  bitget: {
    name: 'Bitget',
    type: 'Assets',
    icon: iconDataSourceBitget,
    desc: 'Support fetching spot account assets data for management and attestation creation.',

    requirePassphase: true,
    constructorF: Bitget,
    baseName: 'api.bitget.com',
  },
  mexc: {
    name: 'MEXC',
    type: 'Assets',
    icon: iconDataSourceMEXC,
    desc: 'Support fetching spot account assets data for management and attestation creation.',

    requirePassphase: false,
    constructorF: Mexc,
    baseName: 'api.mexc.com',
  },
  x: {
    name: 'X',
    type: 'Social',
    icon: iconDataSourceTwitter,
    desc: 'Support fetching tweet & followers data for management and attestation creation.',
    provider: 'Alex',
  },
  github: {
    name: 'Github',
    type: 'Social',
    icon: iconDataSourceGithub,
    desc: 'Support fetching user profile data for management and attestation creation.',
  },
  discord: {
    name: 'Discord',
    type: 'Social',
    icon: iconDataSourceDiscord,
    desc: 'Support fetching account name & status data for management and attestation creation.',
  },
  /*youtube: {
    name: 'Youtube',
    type: 'Social',
    icon: iconDataSourceYoutube,
  },*/
  zan: {
    name: 'ZAN',
    type: 'Humanity',
    icon: iconDataSourceZan,
    desc: 'Support fetching basic identity and KYC verification status data for management and attestation creation.',

    disabled: true,
  },
  google: {
    name: 'Google Account',
    type: 'Social',
    icon: iconDataSourceGoogle,
    desc: 'Support fetching account name & email address data for management and attestation creation.',
  },
};
