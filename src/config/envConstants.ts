import iconTool1 from '@/assets/img/iconTool1.svg';
import iconPolygon from '@/assets/img/iconPolygon.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconOptimism from '@/assets/img/iconOptimism.svg';

type ENVTYPE = 'development' | 'production';

const CURENV = process.env.NODE_ENV as ENVTYPE;
// console.log('CURENV', CURENV);
const PADOURLMAP = {
  development: '18.179.8.186:8888',
  // development: '192.168.31.30:8081',
  production: '127.0.0.1:8081',
};
export const PADOURL = PADOURLMAP[CURENV];

const PROXYURLMAP = {
  development: '18.179.8.186:9000',
  // development: '192.168.31.30:9000',
  production: '127.0.0.1:9000',
};
export const PROXYURL = PROXYURLMAP[CURENV];

const PADOADDRESSMAP = {
  development: '0xe02bd7a6c8aa401189aebb5bad755c2610940a73',
  production: '0x547E9fc83bE78bD656A20952EBE3bEBcc2ef8BD0',
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
      chainId: '0xaa36a7', // numToHex
      chainName: 'Sepolia',
      rpcUrls: [
        'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      ],
      blockExploreUrls: ['https://sepolia.etherscan.io'],
    },
    Polygon: {
      icon: iconPolygon,
      title: 'Polygon',
      disabled: true,
      rpcUrl: '',
      easContact: '',
      schemaUid: '',
    },
  },
  production: {
    Ethereum: {
      icon: iconTool1,
      title: 'Ethereum',
      rpcUrl: 'https://mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      easContact: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
      schemaUid: '',
      chainId: '0x1', // numToHex
      chainName: 'Ethereum',
      rpcUrls: [
        'https://mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      ],
      blockExploreUrls: ['https://etherscan.io/'],
    },
    ArbitrumOne: {
      icon: iconArbitrum,
      title: 'ArbitrumOne',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      easContact: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
      schemaUid: '',
      chainId: '0xa4b1', // numToHex
      chainName: 'ArbitrumOne',
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
      blockExploreUrls: ['https://arbiscan.io'],
    },
    Polygon: {
      icon: iconPolygon,
      title: 'Polygon',
      disabled: true,
      rpcUrl: '',
      easContact: '',
      schemaUid: '',
    },
  },
};
export const EASInfo = EASINFOMAP[CURENV];

export const ONCHAINLIST = Object.values(EASInfo);
console.log('ONCHAINLIST', ONCHAINLIST);

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
