import React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react';
import '@/assets/css/global.css';
import routes from '@/router';
import { Provider } from 'react-redux';
import store from '@/store/index';
const router = createHashRouter(routes);
const container = document.getElementById('app-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript

// 1. Get projectId
const projectId = '0dabe09aae6ef261e2a469af9ccb9b76';

// 2. Set chains
const chains = [
  {
    chainId: 59140,
    name: 'Linea Goerli',
    currency: 'LineaETH',
    explorerUrl: 'https://goerli.lineascan.build',
    rpcUrl:
      'https://linea-goerli.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
  },
  {
    chainId: 11155111,
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
  },
  {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com',
  },

  {
    chainId: 42161,
    name: 'Arbitrum',
    currency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  {
    chainId: 97,
    name: 'BAS-BSC-Testnet',
    currency: 'BNB',
    explorerUrl: 'https://testnet.bscscan.com/',
    rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545/',
  },
];

// 3. Create modal
const metadata = {
  name: 'My Website',
  description: 'My Website description',
  url: 'https://mywebsite.com',
  icons: ['https://avatars.mywebsite.com/'],
};

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains,
  projectId,
  featuredWalletIds: [], // remove default wallets completely,
});
console.log('Page initialization');

// TODO
root.render(
  <>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </>
);
