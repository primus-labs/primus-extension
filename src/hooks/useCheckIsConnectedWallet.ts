import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import {
  setActiveConnectWallet,
  setConnectWalletDialogVisibleAction,
  connectWalletAsync,
} from '@/store/actions';
import { connectWallet, switchChain } from '@/services/wallets/metamask';
// import { switchChain } from '@/services/wallets/metamask';
// check if had connected wallet when switchFlag is true
// if not connected,connect wallet
// if connected,but need switch chain

const useCheckIsConnectedWallet = function useCheckIsConnectedWallet(
  switchFlag = true
) {
  const dispatch = useDispatch();
  const [connected, setConnected] = useState<boolean>(false);
  const connectedWallet = useSelector((state) => state.connectedWallet);
  const activeConnectWallet = useSelector((state) => state.activeConnectWallet);
  const connectWalletDialogVisible = useSelector(
    (state) => state.connectWalletDialogVisible
  );
  const hasConnected = useMemo(() => {
    return !!connectedWallet?.address;
  }, [connectedWallet?.address]);
  const requireSwitchChain = useMemo(() => {
    return !!activeConnectWallet?.network;
  }, [activeConnectWallet?.network]);
  const connectedRightChain = useMemo(() => {
    return hasConnected && !requireSwitchChain;
  }, [hasConnected, requireSwitchChain]);
  const connectedWrongChain = useMemo(() => {
    return hasConnected && requireSwitchChain;
  }, [hasConnected, requireSwitchChain]);
  useEffect(() => {
    if (switchFlag) {
      setConnected(connectedRightChain);
    }
  }, [switchFlag, connectedRightChain, dispatch]);
  useEffect(() => {
    if (switchFlag) {
      // const hasConnected = !!connectedWallet?.address;
      // const requireSwitchChain = !!activeConnectWallet?.network;
      // const connectedRightChain = hasConnected && !requireSwitchChain;
      // const connectedWrongChain = hasConnected && requireSwitchChain;
      if (connectedWrongChain) {
        if (connectWalletDialogVisible === 0) {
          dispatch(setConnectWalletDialogVisibleAction(2));
        }
      } else {
        dispatch(setConnectWalletDialogVisibleAction(connected ? 0 : 1));
      }
    }
  }, [switchFlag, connected, connectWalletDialogVisible,connectedWrongChain]);
  return { connected };
};
export default useCheckIsConnectedWallet;
