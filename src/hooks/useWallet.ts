import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import useWalletConnect from './useWalletConnect';
import {
  connectWalletAsync,
  setConnectWalletActionAsync,
  setConnectWalletDialogVisibleAction,
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
      const targetNetwork = EASInfo[network as keyof typeof EASInfo];
      if (
        walletConnectProvider &&
        network &&
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
      console.log('savedConnectInfo111', savedConnectInfo.current, new Date());
      debugger;
      let formatWalletName = walletName ? walletName.toLowerCase() : undefined;
      setWallet(formatWalletName);
      if (formatWalletName === 'walletconnect') {
        const targetNetwork = EASInfo[network as keyof typeof EASInfo];
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
      } else if (formatWalletName === 'plug wallet') {
        // savedMetaMaskCallback.current();
        // sucFn && sucFn(walletObj, network, label);
        // TODO-icp
        savedConnectInfo.current.startFn();
        chrome.runtime.sendMessage({
          type: 'icp',
          name: 'connectWallet',
          params: {
            walletName: formatWalletName,
            operation: 'createTab',
            path: 'http://localhost:3001/other/connectWallet',
          },
        });
        return;
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
  // const listerFn = useCallback(
  //   async (message: any) => {
  //     if (message.type === 'icp') {
  //       if (message.name === 'connectWallet') {
  //         if (message.result) {
  //           console.log(
  //             'savedConnectInfo222',
  //             savedConnectInfo.current,
  //             new Date()
  //           );
  //           await dispatch(
  //             setConnectWalletActionAsync({
  //               name: 'plug wallet',
  //               address: message.params.address,
  //             })
  //           );
  //           await dispatch(setConnectWalletDialogVisibleAction(false));
  //           debugger;
  //           savedConnectInfo.current?.sucFn();
  //         } else {
  //           debugger;
  //           savedConnectInfo.current?.errorFn();
  //         }
  //       }
  //     }
  //   },
  //   [savedConnectInfo]
  // );
  useEffect(() => {
    const listerFn = async (message: any) => {
      if (message.type === 'icp') {
        if (message.name === 'connectWalletRes') {
          if (message.result) {
            console.log('savedConnectInfo', savedConnectInfo);
            await dispatch(
              setConnectWalletActionAsync({
                name: 'plug wallet',
                address: message.params.address,
              })
            );
            await dispatch(setConnectWalletDialogVisibleAction(false));
            debugger;
            savedConnectInfo.current?.sucFn();
          } else {
            debugger
            savedConnectInfo.current?.errorFn();
          }
        }
      }
    };
    chrome.runtime.onMessage.addListener(listerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listerFn);
    };
  }, [dispatch, savedConnectInfo]);
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
