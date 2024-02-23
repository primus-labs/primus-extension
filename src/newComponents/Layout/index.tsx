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
  initIfHadPwdAsync,
} from '@/store/actions';
import useUpdateOnChainSources from '@/hooks/useUpdateOnChainSources';
import useListener from '@/hooks/useListener';
import { postMsg } from '@/utils/utils';

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
    dispatch(initIfHadPwdAsync());

    // dispatch(initConnectedWalletActionAsync());
    (updateOnChainFn as () => void)();
  }, [dispatch, updateOnChainFn]);
  useEffect(() => {
    initStoreData();
  }, [initStoreData]);

  // TODO-newui create wallet
  const handleClickStart = useCallback(() => {
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
  const queryUserPassword = async () => {
    const msg2 = {
      fullScreenType: 'wallet',
      reqMethodName: 'queryUserPassword',
      params: {},
    };
    postMsg(padoServicePort, msg2);
  };

  useEffect(() => {
    createPadoId();
    queryUserPassword();
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
