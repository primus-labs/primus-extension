import iconTool1 from '@/assets/img/iconTool1.svg';
import iconPolygon from '@/assets/img/iconPolygon.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconOptimism from '@/assets/img/iconOptimism.svg';

type ENVTYPE = 'development' | 'production';

const CURENV = process.env.NODE_ENV as ENVTYPE;
console.log('CURENV', CURENV);
const PADOURLMAP = {
  development: '127.0.0.1:8081',
  production: '127.0.0.1:8081',
};
export const PADOURL = PADOURLMAP[CURENV];

const PROXYURLMAP = {
  development: '127.0.0.1:9000',
  production: '127.0.0.1:9000',
};
export const PROXYURL = PROXYURLMAP[CURENV];

const PADOADDRESSMAP = {
  development: '0xAaceaBC4104a687CaA43a950d8b9cA6F69EcE24F',
  production: '0xAaceaBC4104a687CaA43a950d8b9cA6F69EcE24F',
};
export const PADOADDRESS = PADOADDRESSMAP[CURENV];

const EASINFOMAP = {
  development: {
    Sepolia: {
      icon: iconTool1,
      title: 'Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      schemaUid:
        '0x45316fbaa4070445d3ed1b041c6161c844e80e89c368094664ed756c649413a9',
    },
  },
  production: {
    Ethereum: {
      icon: iconTool1,
      title: 'Ethereum',
      rpcUrl: 'https://mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      easContact: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
      schemaUid: '',
    },
    ArbitrumOne: {
      icon: iconArbitrum,
      title: 'ArbitrumOne',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      easContact: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
      schemaUid: '',
    },
  },
};
export const EASInfo = EASINFOMAP[CURENV]


export const ONCHAINLIST = Object.values(EASInfo)
// [
  // {
  //   icon: iconTool1,
  //   title: 'Tower',
  // },
  // {
  //   icon: iconPolygon,
  //   title: 'polygon',
  // },
  // {
  //   icon: iconArbitrum,
  //   title: 'Arbitrum',
  // },
  // {
  //   icon: iconOptimism,
  //   title: 'Optimism',
  // },
  // {
  //   icon: iconMina,
  //   title: 'mina',
  // },
// ];
