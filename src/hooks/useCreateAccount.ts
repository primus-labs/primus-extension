import React, { useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  initWalletAddressActionAsync,
  initUserInfoActionAsync,
} from '@/store/actions';
import { requestSignTypedData } from '@/services/wallets/utils';
import { getUserIdentity } from '@/services/api/user';

type UseCreateAccount = () => void;
const useCreateAccount: UseCreateAccount = function useCreateAccount() {
  const dispatch = useDispatch();
  const fn = useCallback(async () => {
    const { privateKey, padoCreatedWalletAddress: address } =
      await chrome.storage.local.get([
        'privateKey',
        'padoCreatedWalletAddress',
      ]);
    const privateKeyStr = privateKey?.substr(2);
    // const address = message.res.toLowerCase();
    const timestamp = +new Date() + '';
    await dispatch(initWalletAddressActionAsync());
    let pollingTimer;
    try {
      const signature = await requestSignTypedData(
        privateKeyStr,
        address,
        timestamp
      );
      const getIdentityFn = async () => {
        const res = await getUserIdentity({
          signature: signature as string,
          timestamp,
          address,
        });
        const { rc, result } = res;
        if (rc === 0) {
          clearInterval(pollingTimer);
          const { bearerToken, identifier } = result;
          await chrome.storage.local.set({
            userInfo: JSON.stringify({
              id: identifier,
              token: bearerToken,
            }),
          });
          dispatch(initUserInfoActionAsync);
        }
      };
      pollingTimer = setInterval(getIdentityFn, 1000);
    } catch (e) {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
      console.log('getUserIdentity error', e);
    }
  }, []);
  return {
    createAccountFn: fn,
  };
};
export default useCreateAccount;
