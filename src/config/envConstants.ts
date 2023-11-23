import iconPolygon from '@/assets/img/iconPolygon.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconBinance from '@/assets/img/iconBinance.png';
import iconUpChainEthereum from '@/assets/img/iconUpChainEthereum.svg';
import { getAlgoUrl } from '@/services/api/algorithm';
import iconNetworkLinea from '@/assets/img/credit/iconNetworkLinea.svg';
import iconNetworkScroll from '@/assets/img/credit/iconNetworkScroll.svg';

type ENVTYPE = 'development' | 'test' | 'production';

const CURENV = process.env.NODE_ENV as ENVTYPE;
// const CURENV = 'production';
const PADOURLMAP = {
  development: 'wss://api-dev.padolabs.org/algorithm',
  test: '18.179.8.186:8888',
  production: 'wss://api.padolabs.org/algorithm',
};
export let PADOURL = PADOURLMAP[CURENV];

const PROXYURLMAP = {
  development: 'wss://api-dev.padolabs.org/algoproxy',
  test: '18.179.8.186:9000',
  production: 'wss://api.padolabs.org/algoproxy',
};
export let PROXYURL = PROXYURLMAP[CURENV];

const PADOADDRESSMAP = {
  development: '0xe02bd7a6c8aa401189aebb5bad755c2610940a73',
  test: '0xe02bd7a6c8aa401189aebb5bad755c2610940a73',
  production: '0xDB736B13E2f522dBE18B2015d0291E4b193D8eF6',
};
export const PADOADDRESS = PADOADDRESSMAP[CURENV];

const PADOSERVERURLMAP = {
  development: 'https://api-dev.padolabs.org',
  test: 'http://18.179.8.186:8080',
  production: 'https://api.padolabs.org',
};
export const PADOSERVERURL = PADOSERVERURLMAP[CURENV];

const EASINFOMAP = {
  development: {
    'Scroll Sepolia': {
      showName: 'Scroll',
      icon: iconNetworkScroll,
      title: 'Scroll Sepolia',
      rpcUrl: 'https://sepolia-rpc.scroll.io',
      erc721Contract: '',
      easContact: '',
      easProxyContrac: '',
      easProxyFeeContract: '0x8A047d2FbcEC425D7A28de7bce3630f38eC497c6',
      schemas: {
        'Verax-Scroll-Sepolia': {
          schemaUid:
            '0x89c0a9424f9d62c6cde9feb83653033899fe5df952beab024e38a13c3aae3ee9',
          schemaUidTokenHoldings:
            '0xc9992483a7da0207213d34288b835094b48567290cecf044c48913d3f1472a3a',
          schemaUidIdentification:
            '0x26f9780b51aefe9581802ff0b315decb36701d39766fbb78dbd9b4596b6da0bd',
          schemaUidWeb:
            '0xea3441099f6764cd494e7076d797b439aaf88f0693608a0557e389dfebcff8e9',
        },
        PolygonID: {
          schemaUid:
            '0x35e2eb198b2d9019f0d7c70ea2327c669a81b67721049d65cec92ec5fa5e2905',
          schemaUidTokenHoldings:
            '0x640b7a045d305f646074ac038830aaa2e8edfaac069f7cc2be53ae9034d13ad4',
          schemaUidIdentification:
            '0xf406ce092700219c3be1729e52a0bc9539177e96b4a63d73d1e846ca20e1e900',
        },
      },
      chainId: '0x8274F', //534351
      chainName: 'Scroll Sepolia',
      rpcUrls: ['https://sepolia-rpc.scroll.io'],
      blockExplorerUrls: ['https://sepolia.scrollscan.com'],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      transactionDetailUrl: 'https://sepolia.scrollscan.com/tx',
    },
    'Linea Goerli': {
      showName: 'Linea',
      icon: iconNetworkLinea,
      title: 'Linea Goerli',
      rpcUrl:
        'https://linea-goerli.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      erc721Contract: '',
      easContact: '',
      easProxyContrac: '',
      easProxyFeeContract: '0x515b9dd670176e68b9623926d12082d6f37786f4',
      schemas: {
        'Verax-Linea-Goerli': {
          schemaUid:
            '0x89C0A9424F9D62C6CDE9FEB83653033899FE5DF952BEAB024E38A13C3AAE3EE9',
          schemaUidTokenHoldings:
            '0xC9992483A7DA0207213D34288B835094B48567290CECF044C48913D3F1472A3A',
          schemaUidIdentification:
            '0x26F9780B51AEFE9581802FF0B315DECB36701D39766FBB78DBD9B4596B6DA0BD',
          schemaUidWeb:
            '0x84FDF5748D9AF166503472FF5DEB0CD5F61F006169424805FD5554356AC6DF10',
        },
        PolygonID: {
          schemaUid:
            '0x35E2EB198B2D9019F0D7C70EA2327C669A81B67721049D65CEC92EC5FA5E2905',
          schemaUidTokenHoldings:
            '0x640B7A045D305F646074AC038830AAA2E8EDFAAC069F7CC2BE53AE9034D13AD4',
          schemaUidIdentification:
            '0xF406CE092700219C3BE1729E52A0BC9539177E96B4A63D73D1E846CA20E1E900',
        },
      },
      chainId: '0xE704', //59140
      chainName: 'Linea Goerli',
      rpcUrls: [
        'https://linea-goerli.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      ],
      blockExplorerUrls: ['https://goerli.lineascan.build'],
      nativeCurrency: {
        name: 'LineaETH',
        symbol: 'LineaETH',
        decimals: 18,
      },
      transactionDetailUrl: 'https://goerli.lineascan.build/tx',
    },
    Sepolia: {
      showName: 'Sepolia',
      icon: iconUpChainEthereum,
      title: 'Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      erc721Contract: '0xE71e7b07158963095A5Ea841ADDBd6f20E599292',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
      easProxyFeeContract: '0x140Bd8EaAa07d49FD98C73aad908e69a75867336',
      schemas: {
        EAS: {
          schemaUid:
            '0x45316fbaa4070445d3ed1b041c6161c844e80e89c368094664ed756c649413a9',
          schemaUidTokenHoldings:
            '0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084',
          schemaUidIdentification:
            '0x871cb30613666b4349fe45b1e4af222e7da3c3f3b6487ef99b813a897470cb28',
          schemaUidWeb:
            '0x5f868b117fd34565f3626396ba91ef0c9a607a0e406972655c5137c6d4291af9',
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
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      transactionDetailUrl: 'https://sepolia.easscan.org/attestation/view',
    },

    ArbitrumOne: {
      showName: 'Arbitrum',
      icon: iconArbitrum,
      title: 'ArbitrumOne',
      disabled: true,
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
      blockExplorerUrls: ['https://arbiscan.io'],
    },
    Polygon: {
      showName: 'Polygon',
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
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
    },
    BNB: {
      showName: 'BNB',
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
      blockExplorerUrls: ['https://testnet.bscscan.com/'],
    },
  },
  test: {
    Sepolia: {
      showName: 'Sepolia',
      icon: iconUpChainEthereum,
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
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
    Polygon: {
      showName: 'Polygon',
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
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
    },
    BNB: {
      showName: 'BNB',
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
      blockExplorerUrls: ['https://testnet.bscscan.com/'],
    },
  },
  production: {
    'Scroll Mainnet': {
      showName: 'Scroll',
      icon: iconNetworkScroll,
      title: 'Scroll Mainnet',
      rpcUrl: 'https://rpc.scroll.io',
      erc721Contract: '',
      easContact: '',
      easProxyContrac: '',
      easProxyFeeContract: '0x1A58B9E0Aae7990466eA70d6791876EDcab67Ea7',
      schemas: {
        'Verax-Scroll-Mainnet': {
          schemaUid:
            '0x5C136E30F599E1A646323513BFE92F52AE6CB7C69141B1F156B7E648062BB280',
          schemaUidTokenHoldings:
            '0xc9992483a7da0207213d34288b835094b48567290cecf044c48913d3f1472a3a',
          schemaUidIdentification:
            '0x26f9780b51aefe9581802ff0b315decb36701d39766fbb78dbd9b4596b6da0bd',
          schemaUidWeb:
            '0x84fdf5748d9af166503472ff5deb0cd5f61f006169424805fd5554356ac6df10',
        },
        PolygonID: {
          schemaUid:
            '0x35E2EB198B2D9019F0D7C70EA2327C669A81B67721049D65CEC92EC5FA5E2905',
          schemaUidTokenHoldings:
            '0x640B7A045D305F646074AC038830AAA2E8EDFAAC069F7CC2BE53AE9034D13AD4',
          schemaUidIdentification:
            '0xF406CE092700219C3BE1729E52A0BC9539177E96B4A63D73D1E846CA20E1E900',
        },
      },
      chainId: '0x82750', //534352
      chainName: 'Scroll Mainnet',
      rpcUrls: ['https://rpc.scroll.io'],
      blockExplorerUrls: ['https://scrollscan.com'],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      transactionDetailUrl: 'https://scrollscan.com/tx',
    },
    'Linea Goerli': {
      showName: 'Linea',
      icon: iconNetworkLinea,
      title: 'Linea Goerli',
      rpcUrl: 'https://linea-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      erc721Contract: '',
      easContact: '',
      easProxyContrac: '',
      easProxyFeeContract: '0xc4B7dCba12866f6f8181b949ca443232C4e94334',
      schemas: {
        'Verax-Linea-Mainnet': {
          schemaUid:
            '0x5C136E30F599E1A646323513BFE92F52AE6CB7C69141B1F156B7E648062BB280',
          schemaUidTokenHoldings:
            '0xC9992483A7DA0207213D34288B835094B48567290CECF044C48913D3F1472A3A',
          schemaUidIdentification:
            '0x26F9780B51AEFE9581802FF0B315DECB36701D39766FBB78DBD9B4596B6DA0BD',
          schemaUidWeb:
            '0x84FDF5748D9AF166503472FF5DEB0CD5F61F006169424805FD5554356AC6DF10',
        },
        PolygonID: {
          schemaUid:
            '0x35E2EB198B2D9019F0D7C70EA2327C669A81B67721049D65CEC92EC5FA5E2905',
          schemaUidTokenHoldings:
            '0x640B7A045D305F646074AC038830AAA2E8EDFAAC069F7CC2BE53AE9034D13AD4',
          schemaUidIdentification:
            '0xF406CE092700219C3BE1729E52A0BC9539177E96B4A63D73D1E846CA20E1E900',
        },
      },
      chainId: '0xe708', //59144
      chainName: 'Linea',
      rpcUrls: ['https://linea-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8'],
      blockExplorerUrls: ['https://lineascan.build'],
      nativeCurrency: {
        name: 'LineaETH',
        symbol: 'LineaETH',
        decimals: 18,
      },
      transactionDetailUrl: 'https://lineascan.build/tx',
    },
    ArbitrumOne: {
      showName: 'Arbitrum',
      icon: iconArbitrum,
      title: 'ArbitrumOne',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      erc721Contract: '',
      easContact: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
      easProxyContrac: '0x616bDF7E9041c6F76b0ff6dE9aF5DA2c88A9Ac98',
      easProxyFeeContract: '0xafba8C42b7101e44116660daDEc1A1732E959599',
      schemas: {
        EAS: {
          schemaUid:
            '0xcc1f2c6308ffbb7ac5b915641cbc74b6d6404bcdedaf304f9637e5ef7ecc593d',
          schemaUidTokenHoldings:
            '0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084',
          schemaUidIdentification:
            '0x871cb30613666b4349fe45b1e4af222e7da3c3f3b6487ef99b813a897470cb28',
          schemaUidWeb:
            '0x5f868b117fd34565f3626396ba91ef0c9a607a0e406972655c5137c6d4291af9',
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
      blockExplorerUrls: ['https://arbiscan.io'],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      transactionDetailUrl: 'https://arbitrum.easscan.org/attestation/view',
    },

    Ethereum: {
      showName: 'Ethereum',
      icon: iconUpChainEthereum,
      title: 'Ethereum',
      disabled: true,
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
      blockExplorerUrls: ['https://etherscan.io/'],
    },
    BNB: {
      showName: 'BNB',
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
      blockExplorerUrls: ['https://testnet.bscscan.com/'],
    },
    Polygon: {
      showName: 'Polygon',
      icon: iconPolygon,
      title: 'Polygon',
      disabled: true,
      rpcUrl: '',
      erc721Contract: '0x616bDF7E9041c6F76b0ff6dE9aF5DA2c88A9Ac98',
      easContact: '',
      easProxyContrac: '',
      schemaUid: '',
      schemaUidTokenHoldings: '',
      chainId: '0x89', // numToHex
      chainName: 'Polygon Mainnet',
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com/'],
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
    },
  },
};
export const EASInfo = EASINFOMAP[CURENV];

export const ONCHAINLIST = Object.values(EASInfo);

export const updateAlgoUrl = async () => {
  const { algorithmUrl } = await chrome.storage.local.get(['algorithmUrl']);
  if (!algorithmUrl) {
    console.log('updateAlgoUrl store first');
    const algojsonobj = {
      padoUrl: PADOURL,
      proxyUrl: PROXYURL
    };
    await chrome.storage.local.set({
      algorithmUrl: JSON.stringify(algojsonobj),
    });
  }

  const res = await getAlgoUrl();

  /*const res = {
    "rc": 0,
    "mc": "SUCCESS",
    "msg": "",
    "result": [
        {
            "algorithmDomain": "api1.padolabs.org",
            "algoProxyDomain": "api1.padolabs.org"
        },
        {
          "algorithmDomain": "api-dev.padolabs.org",
          "algoProxyDomain": "api-dev.padolabs.org"
        }
    ]
  };*/

  console.log('updateAlgoUrl res=', res);
  if (res?.rc === 0) {
    let isInited = false;
    res.result.forEach((item: any) => {
      let ws = new WebSocket(`wss://${item.algoProxyDomain}/algoproxy`);
      ws.onopen = async function(e) {
        console.log('updateAlgoUrl onopen url=', item.algoProxyDomain);
        if (!isInited) {
          console.log('updateAlgoUrl onopen update url new');
          PADOURL = `wss://${item.algorithmDomain}/algorithm`;
          PROXYURL = `wss://${item.algoProxyDomain}/algoproxy`;
          const jsonobj = {
            padoUrl: PADOURL,
            proxyUrl: PROXYURL
          };
          await chrome.storage.local.set({
            algorithmUrl: JSON.stringify(jsonobj),
          });
          isInited = true;
        }
        ws.close();
      };
      ws.onerror = function(e) {
        console.log('updateAlgoUrl ws onerror', e);
      }
      ws.onclose = function(e) {
        console.log('updateAlgoUrl ws onclose', e);
      }
    });
  }
};

export const getPadoUrl = async() => {
  const { algorithmUrl } = await chrome.storage.local.get(['algorithmUrl']);
  const algorithmUrlObj = JSON.parse(algorithmUrl);
  console.log('updateAlgoUrl getPadoUrl PADOURL=', algorithmUrlObj.padoUrl);
  return algorithmUrlObj.padoUrl;
}

export const getProxyUrl = async() => {
  const { algorithmUrl } = await chrome.storage.local.get(['algorithmUrl']);
  const algorithmUrlObj = JSON.parse(algorithmUrl);
  console.log('updateAlgoUrl getProxyUrl PROXYURL=', algorithmUrlObj.proxyUrl);
  return algorithmUrlObj.proxyUrl;
}

const LINEASCHEMANAMEMAP = {
  development: 'Verax-Linea-Goerli',
  test: 'Verax-Linea-Goerli',
  production: 'Verax-Linea-Mainnet',
};
export let LINEASCHEMANAME = LINEASCHEMANAMEMAP[CURENV];
const SCROLLSCHEMANAMEMAP = {
  development: 'Verax-Scroll-Sepolia',
  test: 'Verax-Scroll-Sepolia',
  production: 'Verax-Scroll-Mainnet',
};
export let SCROLLSCHEMANAME = SCROLLSCHEMANAMEMAP[CURENV];
const FIRSTVERSIONSUPPORTEDNETWORKNAMEMAP = {
  development: 'Sepolia',
  test: 'Sepolia',
  production: 'ArbitrumOne',
};
export let FIRSTVERSIONSUPPORTEDNETWORKNAME =
  FIRSTVERSIONSUPPORTEDNETWORKNAMEMAP[CURENV];
const CLAIMNFTNETWORKNAMEMAP = {
  development: 'Sepolia',
  test: 'Sepolia',
  production: 'Polygon',
};
export let CLAIMNFTNETWORKNAME = CLAIMNFTNETWORKNAMEMAP[CURENV];