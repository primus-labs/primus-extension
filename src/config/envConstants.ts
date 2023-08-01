import iconTool1 from '@/assets/img/iconTool1.svg';
import iconPolygon from '@/assets/img/iconPolygon.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconOptimism from '@/assets/img/iconOptimism.svg';
import iconBinance from '@/assets/img/iconBinance.png';

type ENVTYPE = 'development' | 'test' | 'production';

// const CURENV = process.env.NODE_ENV as ENVTYPE;
const CURENV = 'production';
const PADOURLMAP = {
  development: 'wss://api.padolabs.org/algorithm',
  test: '18.179.8.186:8888',
  production: 'wss://api.padolabs.org/algorithm',
};
export const PADOURL = PADOURLMAP[CURENV];

const PROXYURLMAP = {
  development: 'wss://api.padolabs.org/algoproxy',
  test: '18.179.8.186:9000',
  production: 'wss://api.padolabs.org/algoproxy',
};
export const PROXYURL = PROXYURLMAP[CURENV];

const PADOADDRESSMAP = {
  development: '0xe02bd7a6c8aa401189aebb5bad755c2610940a73',
  test: '0xe02bd7a6c8aa401189aebb5bad755c2610940a73',
  production: '0xDB736B13E2f522dBE18B2015d0291E4b193D8eF6',
};
export const PADOADDRESS = PADOADDRESSMAP[CURENV];

const PADOSERVERURLMAP = {
  development: 'https://api.padolabs.org',
  test: 'http://18.179.8.186:8080',
  production: 'https://api.padolabs.org',
};
export const PADOSERVERURL = PADOSERVERURLMAP[CURENV];

const EASINFOMAP = {
  development: {
    Sepolia: {
      icon: iconTool1,
      title: 'Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      erc721Contract: '0xE71e7b07158963095A5Ea841ADDBd6f20E599292',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
      schemas: {
        EAS: {
          schemaUid:
            '0x45316fbaa4070445d3ed1b041c6161c844e80e89c368094664ed756c649413a9',
          schemaUidTokenHoldings:
            '0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084',
          schemaUidIdentification:
            '0x871cb30613666b4349fe45b1e4af222e7da3c3f3b6487ef99b813a897470cb28',
        },
        PolygonID: {
          schemaUid:
            '0x518b6ddf38db93ae2bab1164038c6fa0606ce4b5080406749ea65f9415bb0503',
          schemaUidTokenHoldings:
            '0x112d140be471e0fac2dc2ee596c55d5f0c679b8fa9a71c15ec5516b87d6d1278',
          schemaUidIdentification:
            '0xe08e249cc244e018cc56cb05938665fd16e373e77acc23d625e84cd4fe07cc48',
        },
      },
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
      rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
      schemaUid:
        '0x518b6ddf38db93ae2bab1164038c6fa0606ce4b5080406749ea65f9415bb0503',
      schemaUidTokenHoldings:
        '0x112d140be471e0fac2dc2ee596c55d5f0c679b8fa9a71c15ec5516b87d6d1278',
      chainId: '0xaa36a7', // numToHex
      chainName: 'Sepolia',
      rpcUrls: [
        'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      ],
      blockExploreUrls: ['https://sepolia.etherscan.io'],
    },
    BNB: {
      icon: iconBinance,
      title: 'BNB',
      disabled: true,
      rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545/',
      easContact: '0xBF4221C5f98349FACbB28D0ea7bbc57a6834Bfe1',
      easProxyContrac: '0x2884E43B48c2Cc623A19c0c3d260DD8f398fd5F3',
      schemas: {
        EAS: {
          schemaUid:
            '0x45316fbaa4070445d3ed1b041c6161c844e80e89c368094664ed756c649413a9',
          schemaUidTokenHoldings:
            '0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084',
          schemaUidIdentification:
            '0xe2b389fef1bd8887415ac6079090e2ed6377eca6235cb5c5f691ba71cd2ca456',
        },
        PolygonID: {
          schemaUid: '',
          schemaUidTokenHoldings: '',
          schemaUidIdentification: '',
        },
      },
      chainId: '0x61', // numToHex
      chainName: 'BNB Smart Chain Testnet',
      rpcUrls: ['https://data-seed-prebsc-1-s3.binance.org:8545/'],
      blockExploreUrls: ['https://testnet.bscscan.com/'],
    },
  },
  test: {
    Sepolia: {
      icon: iconTool1,
      title: 'Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      erc721Contract: '0xE71e7b07158963095A5Ea841ADDBd6f20E599292',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
      schemas: {
        EAS: {
          schemaUid:
            '0x45316fbaa4070445d3ed1b041c6161c844e80e89c368094664ed756c649413a9',
          schemaUidTokenHoldings:
            '0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084',
          schemaUidIdentification:
            '0x871cb30613666b4349fe45b1e4af222e7da3c3f3b6487ef99b813a897470cb28',
        },
        PolygonID: {
          schemaUid:
            '0x518b6ddf38db93ae2bab1164038c6fa0606ce4b5080406749ea65f9415bb0503',
          schemaUidTokenHoldings:
            '0x112d140be471e0fac2dc2ee596c55d5f0c679b8fa9a71c15ec5516b87d6d1278',
          schemaUidIdentification:
            '0xe08e249cc244e018cc56cb05938665fd16e373e77acc23d625e84cd4fe07cc48',
        },
      },
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
      rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
      schemaUid:
        '0x518b6ddf38db93ae2bab1164038c6fa0606ce4b5080406749ea65f9415bb0503',
      schemaUidTokenHoldings:
        '0x112d140be471e0fac2dc2ee596c55d5f0c679b8fa9a71c15ec5516b87d6d1278',
      chainId: '0xaa36a7', // numToHex
      chainName: 'Sepolia',
      rpcUrls: [
        'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      ],
      blockExploreUrls: ['https://sepolia.etherscan.io'],
    },
    BNB: {
      icon: iconBinance,
      title: 'BNB',
      disabled: true,
      rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545/',
      easContact: '0xBF4221C5f98349FACbB28D0ea7bbc57a6834Bfe1',
      easProxyContrac: '0x2884E43B48c2Cc623A19c0c3d260DD8f398fd5F3',
      schemas: {
        EAS: {
          schemaUid:
            '0x45316fbaa4070445d3ed1b041c6161c844e80e89c368094664ed756c649413a9',
          schemaUidTokenHoldings:
            '0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084',
          schemaUidIdentification:
            '0xe2b389fef1bd8887415ac6079090e2ed6377eca6235cb5c5f691ba71cd2ca456',
        },
        PolygonID: {
          schemaUid: '',
          schemaUidTokenHoldings: '',
          schemaUidIdentification: '',
        },
      },
      chainId: '0x61', // numToHex
      chainName: 'BNB Smart Chain Testnet',
      rpcUrls: ['https://data-seed-prebsc-1-s3.binance.org:8545/'],
      blockExploreUrls: ['https://testnet.bscscan.com/'],
    },
  },
  production: {
    Ethereum: {
      icon: iconTool1,
      title: 'Ethereum',
      rpcUrl: 'https://mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      easContact: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
      easProxyContrac: '',
      schemaUid: '',
      schemaUidTokenHoldings: '',
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
      erc721Contract: '',
      easContact: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
      easProxyContrac: '0x616bDF7E9041c6F76b0ff6dE9aF5DA2c88A9Ac98',
      schemas: {
        EAS: {
          schemaUid:
            '0xcc1f2c6308ffbb7ac5b915641cbc74b6d6404bcdedaf304f9637e5ef7ecc593d',
          schemaUidTokenHoldings:
            '0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084',
          schemaUidIdentification:
            '0x871cb30613666b4349fe45b1e4af222e7da3c3f3b6487ef99b813a897470cb28',
        },
        PolygonID: {
          schemaUid:
            '0x518b6ddf38db93ae2bab1164038c6fa0606ce4b5080406749ea65f9415bb0503',
          schemaUidTokenHoldings:
            '0x112d140be471e0fac2dc2ee596c55d5f0c679b8fa9a71c15ec5516b87d6d1278',
          schemaUidIdentification:
            '0xe08e249cc244e018cc56cb05938665fd16e373e77acc23d625e84cd4fe07cc48',
        },
      },
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
      erc721Contract: '0x616bDF7E9041c6F76b0ff6dE9aF5DA2c88A9Ac98',
      easContact: '',
      easProxyContrac: '',
      schemaUid: '',
      schemaUidTokenHoldings: '',
    },
  },
};
export const EASInfo = EASINFOMAP[CURENV];

export const ONCHAINLIST = Object.values(EASInfo);
// console.log('ONCHAINLIST', ONCHAINLIST);

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
