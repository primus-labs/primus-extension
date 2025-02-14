import React, { useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  initWalletAddressActionAsync,
  initUserInfoActionAsync,
} from '@/store/actions';
import { requestSignTypedData } from '@/services/wallets/utils';
import { getUserIdentity } from '@/services/api/user';
import type { Dispatch } from 'react';

type UseCreateAccount = () => { createAccountFn: () => void };
const useCreateAccount: UseCreateAccount = function useCreateAccount() {
  const dispatch: Dispatch<any> = useDispatch();
  const fn = useCallback(async () => {
    const {
      privateKey,
      padoCreatedWalletAddress: address,
      userInfo,
    } = await chrome.storage.local.get([
      'privateKey',
      'padoCreatedWalletAddress',
      'userInfo',
    ]);

    if (userInfo) {
      await dispatch(initWalletAddressActionAsync());
      await dispatch(initUserInfoActionAsync);
    } else {
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
    }
  }, []);
  return {
    createAccountFn: fn,
  };
};
export default useCreateAccount;
