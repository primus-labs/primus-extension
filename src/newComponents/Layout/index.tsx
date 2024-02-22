import React, { memo, useEffect, useCallback } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import rem from '@/utils/rem.js';
import {
  setSysConfigAction,
  initSourceUpdateFrequencyActionAsync,
  setProofTypesAsync,
  setExSourcesAsync,
  setSocialSourcesAsync,
  setKYCsAsync,
  initUserInfoActionAsync,
  setCredentialsAsync,
  initWalletAddressActionAsync,
  initRewardsActionAsync,
  setOnChainAssetsSourcesAsync,
} from '@/store/actions';
import useUpdateOnChainSources from '@/hooks/useUpdateOnChainSources';
import useListener from '@/hooks/useListener';
import { postMsg } from '@/utils/utils';
import { requestSignTypedData } from '@/services/wallets/utils';
import { getUserIdentity } from '@/services/api/user';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';

import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

import './index.scss';

const Nav: React.FC = memo(({}) => {
  const theme = useSelector((state: UserState) => state.theme);
  const dispatch: Dispatch<any> = useDispatch();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const [updateOnChainLoading, updateOnChainFn] = useUpdateOnChainSources();
  useListener();
  useEffect(() => {
    rem();
  }, []);
  const initStoreData = useCallback(async () => {
    //
    const { twitter } = await chrome.storage.local.get(['twitter']);
    if (twitter) {
      await chrome.storage.local.set({ x: twitter });
      await chrome.storage.local.remove('twitter');
    }
    dispatch(setExSourcesAsync());
    dispatch(setSocialSourcesAsync());
    dispatch(setKYCsAsync());
    dispatch(setProofTypesAsync());
    dispatch(initSourceUpdateFrequencyActionAsync());
    dispatch(initUserInfoActionAsync());
    dispatch(setCredentialsAsync());
    dispatch(initWalletAddressActionAsync());
    dispatch(initRewardsActionAsync());
    dispatch(setOnChainAssetsSourcesAsync());

    // dispatch(initConnectedWalletActionAsync());
    (updateOnChainFn as () => void)();
  }, [dispatch, updateOnChainFn]);
  useEffect(() => {
    initStoreData();
  }, [initStoreData]);

  // TODO-newui create wallet
  const handleClickStart = useCallback(() => {
    const padoServicePortListener = async function (message) {
      if (message.resMethodName === 'create') {
        console.log('page_get:create:', message.res);
        if (message.res) {
          const { privateKey } = await chrome.storage.local.get(['privateKey']);
          const privateKeyStr = privateKey?.substr(2);
          // const address = message.res.toLowerCase();
          const address = message.res;
          const timestamp = +new Date() + '';
          await chrome.storage.local.set({ padoCreatedWalletAddress: address });
          await dispatch(initWalletAddressActionAsync());

          try {
            const signature = await requestSignTypedData(
              privateKeyStr,
              address,
              timestamp
            );
            const res = await getUserIdentity({
              signature: signature as string,
              timestamp,
              address,
            });
            const { rc, result } = res;
            if (rc === 0) {
              const { bearerToken, identifier } = result;
              await chrome.storage.local.set({
                userInfo: JSON.stringify({
                  id: identifier,
                  token: bearerToken,
                }),
              });
              // const targetUrl = backUrl
              //   ? decodeURIComponent(backUrl)
              //   : '/events';
              // navigate(targetUrl);
            }
          } catch (e) {
            console.log('handleClickStart error', e);
          }
        }
      }
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);

    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'create',
      params: {},
    };
    postMsg(padoServicePort, msg);
  }, [padoServicePort]);
  const createPadoId = async () => {
    const { keyStore, padoCreatedWalletAddress, privateKey, userInfo } =
      await chrome.storage.local.get([
        'keyStore',
        'padoCreatedWalletAddress',
        'privateKey',
        'userInfo',
      ]);
    if (!keyStore && !privateKey) {
      handleClickStart();
    }
  };
  useEffect(() => {
    createPadoId();
  }, []);
  return (
    <div className={`PageLayout ${theme}`}>
      <Sidebar />
      <article className="pageRight">
        <Header />
        <div className="page">
          <Outlet />
        </div>

        <Footer />
      </article>
    </div>
  );
});

export default Nav;
