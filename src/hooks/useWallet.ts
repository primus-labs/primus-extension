import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import useWalletConnect from './useWalletConnect';
import {
  connectWalletAsync,
  setConnectWalletActionAsync,
} from '@/store/actions';
import { EASInfo } from '@/config/envConstants';
import { useSelector } from 'react-redux';
import type { UserState } from '@/types/store';

type UseWalletType = () => any;
const useWallet: UseWalletType = function useWallet() {
  const dispatch: React.Dispatch<any> = useDispatch();
  const [wallet, setWallet] = useState<string>();
  const savedConnectInfo = useRef<any>();
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
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
    async (connectObj?: any) => {
      const { startFn, errorFn, sucFn, network, label } =
        savedConnectInfo.current;
      const targetNetwork: any = EASInfo[network as keyof typeof EASInfo];
      if (
        walletConnectProvider &&
        network &&
        targetNetwork &&
        targetNetwork?.chainId &&
        parseInt(targetNetwork?.chainId) !== walletConnectChainId
      ) {
        const res = await walletConnectProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetNetwork.chainId }],
        });
        dispatch(
          connectWalletAsync(
            {
              name: 'walletconnect',
              provider: walletConnectProvider,
              address: walletConnectAddress,
            },
            startFn,
            errorFn,
            sucFn,
            targetNetwork,
            label
          )
        );
      } else {
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
      }
    },
    [
      dispatch,
      walletConnectAddress,
      walletConnectProvider,
      walletConnectChainId,
    ]
  );
  const connect = useCallback(
    async (
      walletName?: string,
      startFn?: () => void,
      errorFn?: () => void,
      sucFn?: (walletObj: any, network?: string, label?: string) => void,
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
        const targetNetwork:any = EASInfo[network as keyof typeof EASInfo];
        if (walletConnectProvider && network) {
          if (parseInt(targetNetwork?.chainId) !== walletConnectChainId) {
            const res = await walletConnectProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetNetwork.chainId }],
            });
          }
        } else {
          openWalletConnectDialog();
        }
      } else if (formatWalletName === 'metamask') {
        // savedMetaMaskCallback.current();
        connectWalletAsyncFn(undefined);
      } else {
        // savedMetaMaskCallback.current();
        connectWalletAsyncFn(undefined);
      }
    },
    [
      openWalletConnectDialog,
      connectWalletAsyncFn,
      walletConnectProvider,
      walletConnectChainId,
    ]
  );
  useEffect(() => {
    if (
      wallet === 'walletconnect' &&
      walletConnectIsConnect &&
      walletConnectProvider
    ) {
      // savedWalletConnectCallback.current();
      connectWalletAsyncFn({
        name: 'walletconnect',
        provider: walletConnectProvider,
        address: walletConnectAddress,
      });
    }
    if (connectedWallet?.name === 'walletconnect' && !walletConnectIsConnect) {
      dispatch(setConnectWalletActionAsync(undefined));
    }
  }, [
    wallet,
    walletConnectIsConnect,
    connectWalletAsyncFn,
    walletConnectProvider,
    walletConnectAddress,
    dispatch,
    connectedWallet,
  ]);
  // useEffect(() => {
  //   console.log('walletConnectChainId', walletConnectChainId);
  // }, [walletConnectChainId]);
  useEffect(() => {
    if (walletConnectProvider) {
      walletConnectProvider.on('chainChanged', (chainId: number) => {
        console.log(
          '222walletConnectProvider chainChanged',
          parseInt(chainId + ''),
          walletConnectProvider
        );
      });
    }
  }, [walletConnectProvider, walletConnectAddress, dispatch]);

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
