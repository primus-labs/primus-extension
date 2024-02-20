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
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';

import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

import './index.scss';

const Nav: React.FC = memo(({ }) => {
  const theme = useSelector((state: UserState) => state.theme);
  const dispatch: Dispatch<any> = useDispatch();
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
