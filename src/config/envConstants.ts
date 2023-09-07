import iconPolygon from '@/assets/img/iconPolygon.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconBinance from '@/assets/img/iconBinance.png';
import iconUpChainEthereum from '@/assets/img/iconUpChainEthereum.svg';
import { getAlgoUrl } from '@/services/api/algorithm';
import iconNetworkLinea from '@/assets/img/credit/iconNetworkLinea.svg';

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
    Sepolia: {
      icon: iconUpChainEthereum,
      title: 'Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      erc721Contract: '0xE71e7b07158963095A5Ea841ADDBd6f20E599292',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
      easProxyFeeContract: '0xb53F5BcB421B0aE0f0d2a16D3f7531A8d00f63aC',
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
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      transactionDetailUrl: 'https://sepolia.easscan.org/attestation/view',
    },
    'Linea Goerli': {
      icon: iconNetworkLinea,
      title: 'Linea Goerli',
      rpcUrl:
        'https://linea-goerli.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      erc721Contract: '0xE71e7b07158963095A5Ea841ADDBd6f20E599292',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
      easProxyFeeContract: '0x9eC56cd6f6CA10Fb9Bc3a3D17D83028639b62DF5',
      schemas: {
        'Verax-Linea-Goerli': {
          schemaUid:
            '0x89C0A9424F9D62C6CDE9FEB83653033899FE5DF952BEAB024E38A13C3AAE3EE9',
          schemaUidTokenHoldings:
            '0xC9992483A7DA0207213D34288B835094B48567290CECF044C48913D3F1472A3A',
          schemaUidIdentification:
            '0x26F9780B51AEFE9581802FF0B315DECB36701D39766FBB78DBD9B4596B6DA0BD',
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
    ArbitrumOne: {
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
    ArbitrumOne: {
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
    'Linea Goerli': {
      icon: iconNetworkLinea,
      title: 'Linea Goerli',
      rpcUrl:
        'https://linea-goerli.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      erc721Contract: '0xE71e7b07158963095A5Ea841ADDBd6f20E599292',
      easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
      easProxyFeeContract: '0x9eC56cd6f6CA10Fb9Bc3a3D17D83028639b62DF5',
      schemas: {
        'Verax-Linea-Goerli': {
          schemaUid:
            '0x89C0A9424F9D62C6CDE9FEB83653033899FE5DF952BEAB024E38A13C3AAE3EE9',
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
      chainId: '0xE704', //59140
      chainName: 'Linea',
      rpcUrls: [
        'https://linea-goerli.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      ],
      blockExplorerUrls: ['https://goerli.lineascan.build'],
      nativeCurrency: {
        name: 'LineaETH',
        symbol: 'LineaETH',
        decimals: 18,
      },
      transactionDetailUrl: 'https://lineascan.build/tx',
    },
    Ethereum: {
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
  if (res.rc === 0) {
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
const FIRSTVERSIONSUPPORTEDNETWORKNAMEMAP = {
  development: 'Sepolia',
  test: 'Sepolia',
  production: 'ArbitrumOne',
};
export let FIRSTVERSIONSUPPORTEDNETWORKNAME =
  FIRSTVERSIONSUPPORTEDNETWORKNAMEMAP[CURENV];
