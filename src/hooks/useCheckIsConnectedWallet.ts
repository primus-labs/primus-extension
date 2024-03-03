import React, { useRef, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { setConnectWalletDialogVisibleAction } from '@/store/actions';
// check if had connected wallet when switchFlag is true
// if not ,connect wallet

const useCheckIsConnectedWallet = function useCheckIsConnectedWallet(
  switchFlag = true
) {
  const dispatch = useDispatch();
  const [connected, setConnected] = useState<boolean>(false);
  const connectedWallet = useSelector((state) => state.connectedWallet);
  useEffect(() => {
    if (switchFlag) {
      setConnected(!!connectedWallet?.address);
    }
  }, [switchFlag, connectedWallet?.address]);
  useEffect(() => {
    if (switchFlag) {
      dispatch(setConnectWalletDialogVisibleAction(!connected));
    }
  }, [switchFlag,connected, dispatch]);
  return { connected };
};
export default useCheckIsConnectedWallet;
