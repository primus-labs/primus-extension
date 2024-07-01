import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import useWalletConnect from './useWalletConnect';
import {
  connectWalletAsync,
  setConnectWalletActionAsync,
  setActiveConnectWallet,
} from '@/store/actions';
import { EASInfo } from '@/config/chain';
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
  const activeConnectWallet = useSelector(
    (state: UserState) => state.activeConnectWallet
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
      const targetNetwork = activeConnectWallet.network;
      // const targetNetwork: any = EASInfo[network as keyof typeof EASInfo];
      if (walletConnectProvider && targetNetwork) {
        if (
          targetNetwork?.chainId &&
          parseInt(targetNetwork?.chainId) !== walletConnectChainId
        ) {
          const res = await walletConnectProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetNetwork.chainId }],
          });
          dispatch(setActiveConnectWallet({ network: undefined }));
        } else {
          dispatch(setActiveConnectWallet({ network: undefined }));
        }

        dispatch(
          connectWalletAsync(
            {
              name: 'walletconnect',
              id: 'walletconnect',
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
      walletId?: string,
      startFn?: () => void,
      errorFn?: () => void,
      sucFn?: (walletObj: any, network?: string, label?: string) => void,
      network?: any,
      label?: string
    ) => {
      savedConnectInfo.current = {
        walletId,
        startFn,
        errorFn,
        sucFn: (walletObj: any) => {
          sucFn && sucFn(walletObj, network, label);
        },
        network,
        label,
      };

      setWallet(walletId);
      if (walletId === 'walletconnect') {
        // let network = activeConnectWallet.network;
        // const targetNetwork: any = EASInfo[network as keyof typeof EASInfo];

        const targetNetwork = activeConnectWallet.network;

        if (walletConnectProvider && targetNetwork) {
          if (parseInt(targetNetwork?.chainId) !== walletConnectChainId) {
            try {
              const res = await walletConnectProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: targetNetwork.chainId }],
              });
              dispatch(setActiveConnectWallet({ network: undefined }));
            } catch (e) {
              console.log('222switchEthereumChain error:', e);
            }
          } else {
            dispatch(setActiveConnectWallet({ network: undefined }));
            connectWalletAsyncFn({
              name: 'walletconnect',
              id: 'walletconnect',
              provider: walletConnectProvider,
              address: walletConnectAddress,
            });
          }
        } else {
          const { connectedWalletAddress } = await chrome.storage.local.get([
            'connectedWalletAddress',
          ]);
          if (
            connectedWalletAddress &&
            JSON.parse(connectedWalletAddress).id === 'walletconnect'
          ) {
            // Initialize the page, using the last account connection by default
          } else {
            openWalletConnectDialog();
          }
        }
      } else if (walletId === 'metamask') {
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
      activeConnectWallet,
    ]
  );
  useEffect(() => {
    if (connectedWallet) {
      if (connectedWallet?.id === 'walletconnect' && !walletConnectIsConnect) {
        dispatch(setConnectWalletActionAsync(undefined));
      }
    } else {
      if (
        wallet === 'walletconnect' &&
        walletConnectIsConnect &&
        walletConnectProvider
      ) {
        // savedWalletConnectCallback.current();
        connectWalletAsyncFn({
          name: 'walletconnect',
          id: 'walletconnect',
          provider: walletConnectProvider,
          address: walletConnectAddress,
        });
      }
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
