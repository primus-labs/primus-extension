import React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react';
import 'animate.css';
import '@/assets/css/global.css';
import '@/assets/newCss/global.css';

import routes from '@/router';
import { Provider } from 'react-redux';
import store from '@/store/index';
// export const EASInfo = EASINFOMAP[CURENV];
import { EASInfo } from '@/config/chain';
const router = createHashRouter(routes);
const container = document.getElementById('app-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript

// 1. Get projectId
const projectId = '0dabe09aae6ef261e2a469af9ccb9b76';

const supportChains = Object.values(EASInfo)
  .filter((i) => !i.disabled)
  .map((i) => {
    return {
      chainId: parseInt(i.chainId),
      name: i.title,
      currency: i.nativeCurrency.symbol,
      explorerUrl: i.blockExplorerUrls[0],
      rpcUrl: i.rpcUrls[0],
    };
  });
// 2. Set chains
const chains = [
  {
    chainId: 534351,
    name: 'Scroll Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.scrollscan.com',
    rpcUrl: 'https://sepolia-rpc.scroll.io',
  },
  {
    chainId: 59140,
    name: 'Linea Goerli',
    currency: 'LineaETH',
    explorerUrl: 'https://goerli.lineascan.build',
    rpcUrl:
      'https://linea-goerli.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
  },
  {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com',
  },
  {
    chainId: 11155111,
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
  },
  {
    chainId: 97,
    name: 'BAS-BSC-Testnet',
    currency: 'BNB',
    explorerUrl: 'https://testnet.bscscan.com/',
    rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545/',
  },
  // {
  //   chainId: 42161,
  //   name: 'Arbitrum',
  //   currency: 'ETH',
  //   explorerUrl: 'https://arbiscan.io',
  //   rpcUrl: 'https://arb1.arbitrum.io/rpc',
  // },
];

// 3. Create modal
const metadata = {
  name: 'Primus',
  description: 'The Decentralized zkAttestation and Computation Network',
  url: 'https://padolabs.org/',
  icons: ['https://avatars.mywebsite.com/'],
};
createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: supportChains,
  projectId,
  featuredWalletIds: [], // remove default wallets completely,
  defaultChain: supportChains[0],
});
console.log('Page initialization');

root.render(
  <>
    <Provider store={store}>
        <RouterProvider router={router} />
    </Provider>
  </>
);
