import iconWalletCoinbaseWallet from '@/assets/img/iconWalletCoinbaseWallet.svg';
import iconWalletTrustWallet from '@/assets/img/iconWalletTrustWallet.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
import iconWalletWalletConnect from '@/assets/img/iconWalletWalletConnect.svg';
import iconWalletTokenPocket from '@/assets/img/iconWalletTokenPocket.svg';
import iconMina from '@/assets/img/iconMina.png';
export type newWALLETITEMTYPE = {
  icon: any;
  name: string;
  id: string | number;
  disabled?: boolean;
};

export const WALLETLIST: newWALLETITEMTYPE[] = [
  {
    icon: iconWalletMetamask,
    name: 'MetaMask',
    id: 'metamask',
  },
  {
    icon: iconWalletWalletConnect,
    name: 'WalletConnect',
    id: 'walletconnect',
    disabled: true,
  },
  {
    icon: iconWalletCoinbaseWallet,
    name: 'CoinbaseWallet',
    id: 'coinbasewallet',
    disabled: true,
  },
  {
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
];
