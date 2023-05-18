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
import iconDataSourceYoutube from '@/assets/img/icondataSourceYoutube.svg'
import Binance from '@/services/exchange/binance';
import OKX from '@/services/exchange/okx';
import KuCoin from '@/services/exchange/kucoin';
import Coinbase from '@/services/exchange/coinbase';
import Huobi from '@/services/exchange/huobi';
import Gate from '@/services/exchange/gate';
import Bitget from '@/services/exchange/bitget';
import Bybit from '@/services/exchange/bybit';
import Mexc from '@/services/exchange/mexc';

export type ExchangeMeta = {
  name: string,
  type: 'Social' | 'Assets',
  icon: any,
  requirePassphase?: boolean,
  constructorF?: any,
};
export type DataSourceMapType = {
  [propName: string]: ExchangeMeta
};
export const DATASOURCEMAP: DataSourceMapType = {
  binance: {
    name: 'Binance',
    type: 'Assets',
    icon: iconDataSourceBinance,
    constructorF: Binance,
  },
  coinbase: {
    name: 'Coinbase',
    type: 'Assets',
    icon: iconDataSourceCoinbase,
    requirePassphase: false,
    constructorF: Coinbase,
  },
  kucoin: {
    name: 'KuCoin',
    type: 'Assets',
    icon: iconDataSourceKucoin,
    requirePassphase: true,
    constructorF: KuCoin,
  },
  bybit: {
    name: 'Bybit',
    type: 'Assets',
    icon: iconDataSourceBybit,
    requirePassphase: false,
    constructorF: Bybit,
  },
  okx: {
    name: 'OKX',
    type: 'Assets',
    icon: iconDataSourceOKX,
    requirePassphase: true,
    constructorF: OKX,
  },
  gate: {
    name: 'Gate',
    type: 'Assets',
    icon: iconDataSourceGate,
    requirePassphase: false,
    constructorF: Gate,
  },
  huobi: {
    name: 'Huobi',
    type: 'Assets',
    icon: iconDataSourceHuobi,
    requirePassphase: false,
    constructorF: Huobi,
  },
  bitget: {
    name: 'Bitget',
    type: 'Assets',
    icon: iconDataSourceBitget,
    requirePassphase: true,
    constructorF: Bitget,
  },
  mexc: {
    name: 'MEXC',
    type: 'Assets',
    icon: iconDataSourceMEXC,
    requirePassphase: false,
    constructorF: Mexc,
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
  }
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
  '#ED8F5A'
];

export const ExchangeStoreVersion = '1.0.0';
export const SocailStoreVersion = '1.0.0';

export const USDT = 'USDT';
export const USD = 'USD';
export const USDC = 'USDC';
export const DAI = 'DAI';
export const BUSD = 'BUSD';
export const TUSD = 'TUSD';
export const BTC = 'BTC';
export const LDO = 'LDO';
export const STABLETOKENLIST = [USDT,USD,USDC,DAI,BUSD,TUSD]

export const EASInfo = {
  Ethereum : {
    rpcUrl: 'https://mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
    easContact: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
    schemaUid: '',
  },
  ArbitrumOne: {
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    easContact: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
    schemaUid: '',
  },
  Sepolia : {
    rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
    easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
    schemaUid: '0x72785c9098718a320672387465aba432ea1f2a40e7c2acc67f61ee5d8e7f5b09',
  },
};