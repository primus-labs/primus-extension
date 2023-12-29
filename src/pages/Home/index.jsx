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
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com',
  },
  {
    chainId: 534351,
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.scrollscan.com',
    rpcUrl: 'https://sepolia-rpc.scroll.io',
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
