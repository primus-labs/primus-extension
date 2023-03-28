import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceOKX from '@/assets/img/iconDataSourceOKX.svg';
import iconDataSourceKucoin from '@/assets/img/iconDataSourceKucoin.svg';
import Binance from '@/services/exchange/binance';

export type ExchangeMeta = {
  name: string,
  type: string,
  icon: any,
  requirePassphase?: Boolean,
  constructorF?: any,
};

export const DATASOURCEMAP = {
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
  },
  kucoin: {
    name: 'KuCoin',
    type: 'Assets',
    icon: iconDataSourceKucoin,
    requirePassphase: true,
  },
  twitter: {
    name: 'Twitter',
    type: 'Social',
    icon: iconDataSourceTwitter,
  },
};
