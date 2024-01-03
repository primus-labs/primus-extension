import React, { useRef, useEffect } from 'react';


import {
  useWeb3Modal,
  useWeb3ModalProvider,
  useWeb3ModalAccount,
  useDisconnect,
  useWeb3ModalState,
  useWeb3ModalEvents,
} from '@web3modal/ethers5/react';
;

type UseWalletConnectType = () => any;
const useWalletConnect: UseWalletConnectType = function useWalletConnect() {
  
  const { open: openWalletConnectDialog } = useWeb3Modal();
  const {
    address: walletConnectAddress,
    chainId: walletConnectChainId,
    isConnected: walletConnectIsConnect,
  } = useWeb3ModalAccount();
  const { walletProvider: walletConnectProvider } = useWeb3ModalProvider();
  const { open: isOpen, selectedNetworkId: walletConnectNetworkId } =
    useWeb3ModalState();
  const events = useWeb3ModalEvents();
  console.log('events', events);
  const { disconnect: disconnectWalletConnect } = useDisconnect();

  return {
    openWalletConnectDialog,
    disconnectWalletConnect,
    walletConnectAddress,
    walletConnectProvider,
    walletConnectIsConnect,
    walletConnectChainId,
    walletConnectNetworkId,
  };
};
export default useWalletConnect;
