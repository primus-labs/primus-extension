import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useWalletConnect from './useWalletConnect';
import {
  connectWalletAsync,
  setConnectWalletActionAsync,
} from '@/store/actions';
import { EASInfo } from '@/config/envConstants';

type UseWalletType = () => // metamaskCallback: () => void,
// walletConnectCallback: () => void,
// startFn: () => void,
// errorFn: () => void,
// sucFn?: (walletObj: any) => void,
// network?: any,
// label?: string
any;
const useWallet: UseWalletType = function useWallet() {
  // metaMaskCallback,
  // walletConnectCallback,
  // startFn,
  // errorFn,
  // sucFn,
  // network,
  // label
  const dispatch: React.Dispatch<any> = useDispatch();
  const [wallet, setWallet] = useState<string>();
  const savedConnectInfo = useRef<any>();
  // const savedMetaMaskCallback = useRef(() => {});
  // const savedWalletConnectCallback = useRef(() => { });
  // const savedStartFn = useRef(() => {});
  // const savedErrorFn = useRef(() => {});
  // const savedSucFn = useRef((walletObj: any) => {});

  // useEffect(() => {
  //   // savedMetaMaskCallback.current = metaMaskCallback;
  //   // savedWalletConnectCallback.current = walletConnectCallback;
  //   savedStartFn.current = startFn;
  //   savedErrorFn.current = errorFn;
  //   sucFn && (savedSucFn.current = sucFn);
  // });
  const {
    openWalletConnectDialog,
    disconnectWalletConnect,
    walletConnectAddress,
    walletConnectProvider,
    walletConnectIsConnect,
    walletConnectChainId,
    walletConnectNetworkId,
  } = useWalletConnect();
  const connectWalletAsyncFn = useCallback(
    (connectObj?: any) => {
      const { startFn, errorFn, sucFn, network, label } =
        savedConnectInfo.current;
      const targetNetwork = EASInfo[network as keyof typeof EASInfo];
      dispatch(
        connectWalletAsync(
          connectObj,
          startFn,
          errorFn,
          sucFn,
          targetNetwork,
          label
        )
      );
    },
    [dispatch]
  );
  const connect = useCallback(
    (
      walletName?: string,
      startFn?: () => void,
      errorFn?: () => void,
      sucFn?: (walletObj: any, network?:string,label?:string,) => void,
      network?: any,
      label?: string
    ) => {
      savedConnectInfo.current = {
        walletName,
        startFn,
        errorFn,
        sucFn: (walletObj: any) => {
          sucFn && sucFn(walletObj, network, label);
        },
        network,
        label,
      };
      let formatWalletName = walletName ? walletName.toLowerCase() : undefined;
      setWallet(formatWalletName);
      if (formatWalletName === 'walletconnect') {
        openWalletConnectDialog();
      } else if (formatWalletName === 'metamask') {
        // savedMetaMaskCallback.current();
        connectWalletAsyncFn(undefined);
      } else {
        // savedMetaMaskCallback.current();
        connectWalletAsyncFn(undefined);
      }
    },
    [openWalletConnectDialog, connectWalletAsyncFn]
  );
  useEffect(() => {
    if (wallet === 'walletconnect' && walletConnectIsConnect) {
      // savedWalletConnectCallback.current();
      connectWalletAsyncFn({
        name: 'walletconnect',
        provider: walletConnectProvider,
        address: walletConnectAddress,
      });
    }
    if (!walletConnectIsConnect) {
      dispatch(setConnectWalletActionAsync(undefined));
    }
  }, [
    wallet,
    walletConnectIsConnect,
    connectWalletAsyncFn,
    walletConnectProvider,
    walletConnectAddress,
    dispatch,
  ]);
  useEffect(() => {
    console.log('222123walletConnectChainId+walletConnectChainId');
  }, [walletConnectChainId, walletConnectChainId]);
  useEffect(() => {
    if (walletConnectProvider) {
      walletConnectProvider.on('chainChanged', (chainId: number) => {
        console.log('222walletconnect chainChanged', chainId);
      });
    }
  }, [walletConnectProvider]);

  return {
    connect,
    openWalletConnectDialog,
    disconnectWalletConnect,
    walletConnectAddress,
    walletConnectProvider,
    walletConnectIsConnect,
    walletConnectChainId,
    walletConnectNetworkId,
  };
};
export default useWallet;
