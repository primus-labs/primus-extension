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
  setConnectedWalletsActionAsync,
} from '@/store/actions';
import useUpdateOnChainSources from '@/hooks/useUpdateOnChainSources';
import useListener from '@/hooks/useListener';
import useALGAttest from '@/hooks/useALGAttest';
import useKeepConnect from '@/hooks/useKeepConnect';
import usePollingUpdateAllSources from '@/hooks/usePollingUpdateAllSources';

import { postMsg, compareVersions } from '@/utils/utils';
import { updateAlgoUrl } from '@/config/envConstants';

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
  useALGAttest();
  useKeepConnect();
  // usePollingUpdateAllSources()// TODO-newui

  const initStoreData = useCallback(async () => {
    // Compatible with old certificates
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    Object.values(credentialObj).forEach((i: any) => {
      const compareRes = compareVersions('1.0.3', i.credVersion);
      if (compareRes > -1) {
        // attestation version <= '1.0.3'
        if (i.type === 'ASSETS_PROOF') {
          i.attestationType = 'Assets Certificate';
          i.verificationContent = 'Assets Proof';
          i.verificationValue = i.baseValue;
        } else if (i.type === 'TOKEN_HOLDINGS') {
          i.attestationType = 'Assets Certificate';
          i.verificationContent = 'Token Holding';
          i.verificationValue = i.holdingToken;
        } else if (i.type === 'IDENTIFICATION_PROOF') {
          i.attestationType = 'Humanity Verification';
          const uiContent = i?.uiTemplate?.proofContent;
          if (
            i.proofContent === 'Account Ownership' ||
            uiContent === 'Account Ownership'
          ) {
            i.verificationContent = 'Owns an account';
            i.verificationValue = 'N/A';
          }
          if (uiContent === 'KYC Status') {
            i.verificationContent = 'KYC Status';
            i.verificationValue = 'Basic Verification';
          }
          
        } else if (i.type === 'UNISWAP_PROOF') {
          i.attestationType = 'On-chain Transaction';
          i.verificationContent = 'Largest ETH/USDC Uniwap Transaction';
          i.verificationValue = i.dataToBeSigned.content;
        }
      }
    });

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
    dispatch(setConnectedWalletsActionAsync());

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
  const getSysConfig = useCallback(async () => {
    postMsg(padoServicePort, {
      fullScreenType: 'padoService',
      reqMethodName: 'getSysConfig',
    });
    console.log('page_send:getSysConfig request');
  }, [dispatch, padoServicePort]);

  useEffect(() => {
    createPadoId();
    queryUserPassword();
    getSysConfig();
    updateAlgoUrl();
    rem();
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
