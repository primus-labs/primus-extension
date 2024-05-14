import iconWalletCoinbaseWallet from '@/assets/img/iconWalletCoinbaseWallet.svg';
import iconWalletTrustWallet from '@/assets/img/iconWalletTrustWallet.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
import iconWalletWalletConnect from '@/assets/img/iconWalletWalletConnect.svg';
import iconWalletTokenPocket from '@/assets/img/iconWalletTokenPocket.svg';
import iconMina from '@/assets/img/iconMina.png';
import type { newWALLETITEMTYPE, WALLETMAPTYPE } from '@/types/config';

export const WALLETMAP: WALLETMAPTYPE = {
  metamask: {
    icon: iconWalletMetamask,
    name: 'MetaMask',
    id: 'metamask',
  },
  walletconnect: {
    icon: iconWalletWalletConnect,
    name: 'WalletConnect',
    id: 'walletconnect',
    disabled: true,
  },
  coinbasewallet: {
    icon: iconWalletCoinbaseWallet,
    name: 'CoinbaseWallet',
    id: 'coinbasewallet',
    disabled: true,
  },
  plugwallet: {
    icon: iconWalletCoinbaseWallet,
    name: 'PlugWallet',
    id: 'plugwallet',
    disabled: true,
  },
  // {
  //   icon: iconWalletTokenPocket,
  //   name: 'TokenPocket',
  //   id: 'tokenpocket',
  //   disabled: true,
  // },
  // {
  //   icon: iconWalletTrustWallet,
  //   name: 'TrustWallet',
  //   disabled: true,
  // },
};
export const WALLETLIST: newWALLETITEMTYPE[] = Object.values(WALLETMAP);
