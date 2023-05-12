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
import Binance from '@/services/exchange/binance';
import OKX from '@/services/exchange/okx';
import KuCoin from '@/services/exchange/kucoin';
import Coinbase from '@/services/exchange/coinbase';
import Huobi from '@/services/exchange/huobi';
import Gate from '@/services/exchange/huobi';
import Bitget from '@/services/exchange/bitget';
import Bybit from '@/services/exchange/bybit';
import Mexc from '@/services/exchange/huobi';

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
  okx: {
    name: 'OKX',
    type: 'Assets',
    icon: iconDataSourceOKX,
    requirePassphase: true,
    constructorF: OKX,
  },
  kucoin: {
    name: 'KuCoin',
    type: 'Assets',
    icon: iconDataSourceKucoin,
    requirePassphase: true,
    constructorF: KuCoin,
  },
  coinbase: {
    name: 'Coinbase',
    type: 'Assets',
    icon: iconDataSourceCoinbase,
    requirePassphase: false,
    constructorF: Coinbase,
  },
  huobi: {
    name: 'Huobi',
    type: 'Assets',
    icon: iconDataSourceHuobi,
    requirePassphase: false,
    constructorF: Huobi,
  },
  gate: {
    name: 'Gate',
    type: 'Assets',
    icon: iconDataSourceGate,
    requirePassphase: false,
    constructorF: Gate,
  },
  bitget: {
    name: 'Bitget',
    type: 'Assets',
    icon: iconDataSourceBitget,
    requirePassphase: true,
    constructorF: Bitget,
  },
  bybit: {
    name: 'Bybit',
    type: 'Assets',
    icon: iconDataSourceBybit,
    requirePassphase: false,
    constructorF: Bybit,
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