// no use
import React, { useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import {
  bindConnectedWallet,
  checkIfBindConnectedWallet,
} from '@/services/api/user';
import {
  setConnectWalletDialogVisibleAction,
  setConnectWalletActionAsync,
} from '@/store/actions';

type UseInterval = (
  startCallback?: () => void,
  errorCallback?: () => void,
) => any;
const useConnect: UseInterval = function useConnect(
  startCallback = () => {},
  errorCallback =() => {},
) {
  const savedCallback = useRef(() => {});
  useEffect(() => {
    savedCallback.current = startCallback;
  });
  const savedErrorCallback = useRef(() => {});
  useEffect(() => {
    savedErrorCallback.current = errorCallback;
  });
  const dispatch: React.Dispatch<any> = useDispatch();
  const connectFn = useCallback(async () => {
    try {
      const [accounts, chainId, provider] = await connectWallet();
      const address = (accounts as string[])[0];
      const type = 'metamask';
      const checkRes = await checkIfBindConnectedWallet({ address });
      if (checkRes.rc === 0 && checkRes.result) {
        await dispatch(
          setConnectWalletActionAsync({ name: type, address, provider })
        );
        await dispatch(setConnectWalletDialogVisibleAction(false));
        return;
      }
      // TODO
      const handler = () => savedCallback.current();
      handler();
      await dispatch(setConnectWalletDialogVisibleAction(true));
      const timestamp: string = +new Date() + '';
      const signature = await requestSign(address, timestamp);

      if (!signature) {
        const errorhandler = () => savedErrorCallback.current();
        errorhandler();
        return;
      }
      const res = await bindConnectedWallet({
        signature,
        timestamp,
        address,
        type,
      });
      const { rc, result } = res;
      if (rc === 0 && result) {
        await dispatch(
          setConnectWalletActionAsync({ name: type, address, provider })
        );
        await dispatch(setConnectWalletDialogVisibleAction(false));
      }
    } catch (e) {
      console.log('useConnect catch e=', e);
      const errorhandler = () => savedErrorCallback.current();
      errorhandler();
    }
  }, [dispatch]);
  return connectFn;
};
export default useConnect;
