import React, { memo, useEffect, useCallback, useRef } from 'react';
import { useLocation, Outlet, ScrollRestoration } from 'react-router-dom';
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
  // initRewardsActionAsync,
  setOnChainAssetsSourcesAsync,
  initIfHadPwdAsync,
  setConnectedWalletsActionAsync,
  initEventsActionAsync,
  setNftsActionAsync,
  initNftsActionAsync,
  // setEarlyBirdNFTAsync,
  // setEventsLotteryResultsAsync,
  initSetThemeAction,
  initSetNewRewardsAction,
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
import PMsgs from '@/newComponents/PMsgs';

import './index.scss';
type LayoutProps = {
  children?: any;
};
const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  const pageRightInstance = useRef<any>(null);
  const pageInstance = useRef<any>(null);
  const pagelayoutInstance = useRef(null);
  const { pathname } = useLocation();
  const theme = useSelector((state: UserState) => state.theme);
  const userInfo = useSelector((state: UserState) => state.userInfo);
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  console.log('222userInfo', userInfo);
  const dispatch: Dispatch<any> = useDispatch();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  // const [updateOnChainLoading, updateOnChainFn] = useUpdateOnChainSources();
  useListener();
  useALGAttest();
  useKeepConnect();
  usePollingUpdateAllSources();

  const initStoreData = useCallback(async () => {
    // Compatible with old certificates
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    Object.values(credentialObj).forEach((i: any) => {
      const compareRes = compareVersions('1.0.4', i.version); // TODO-newui!!!
      if (compareRes > -1) {
        // attestation version <= '1.0.3'
        if (i.type === 'ASSETS_PROOF') {
          i.attestationType = 'Assets Verification';
          i.verificationContent = 'Assets Proof';
          i.verificationValue = i.baseValue;
        } else if (i.type === 'TOKEN_HOLDINGS') {
          i.attestationType = 'Assets Verification';
          i.verificationContent = 'Token Holding';
          i.verificationValue = i.holdingToken;
        } else if (i.type === 'IDENTIFICATION_PROOF') {
          i.attestationType = 'Humanity Verification';
          const uiContent = i?.uiTemplate?.proofContent;
          if (
            i.proofContent === 'Account Ownership' ||
            uiContent === 'Account Ownership'
          ) {
            i.verificationContent = 'Account ownership';
            i.verificationValue = 'Account owner';
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
    await chrome.storage.local.set({
      credentials: JSON.stringify(credentialObj),
    });

    dispatch(setExSourcesAsync());
    dispatch(setSocialSourcesAsync());
    dispatch(setKYCsAsync());
    dispatch(setProofTypesAsync());
    dispatch(initSourceUpdateFrequencyActionAsync());
    dispatch(initUserInfoActionAsync());
    dispatch(setCredentialsAsync());
    dispatch(initWalletAddressActionAsync());
    // dispatch(initRewardsActionAsync());
    dispatch(setOnChainAssetsSourcesAsync());
    dispatch(initIfHadPwdAsync());
    dispatch(setConnectedWalletsActionAsync());
    dispatch(initEventsActionAsync());
    dispatch(initNftsActionAsync());
    // dispatch(setEarlyBirdNFTAsync());
    // dispatch(setEventsLotteryResultsAsync());
    dispatch(initSetThemeAction());
    dispatch(initSetNewRewardsAction());
    // dispatch(initConnectedWalletActionAsync());
    // (updateOnChainFn as () => void)();
  }, [dispatch]);
  // useEffect(() => {
  //   if (connectedWallet?.address) {
  //     dispatch(setEarlyBirdNFTAsync());
  //   }
  // }, [connectedWallet?.address]);

  useEffect(() => {
    initStoreData();
  }, [initStoreData]);

  // TODO-newui create wallet
  // const handleClickStart = useCallback(() => {
  //   const msg = {
  //     fullScreenType: 'wallet',
  //     reqMethodName: 'create',
  //     params: {},
  //   };
  //   postMsg(padoServicePort, msg);
  // }, [padoServicePort]);
  // const createPadoId = async () => {
  //   const { keyStore, padoCreatedWalletAddress, privateKey, userInfo } =
  //     await chrome.storage.local.get([
  //       'keyStore',
  //       'padoCreatedWalletAddress',
  //       'privateKey',
  //       'userInfo',
  //     ]);
  //   if (!keyStore && !privateKey) {
  //     handleClickStart();
  //   }
  // };
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
    // createPadoId();
    queryUserPassword();
    getSysConfig();
    updateAlgoUrl();
    rem();
  }, []);

  return (
    <div
      className={`PageLayout ${theme} ${
        userInfo?.token ? '' : 'pointerEventNone'
      }`}
      ref={pagelayoutInstance}
    >
      <Sidebar />
      <article className="pageRight" ref={pageRightInstance}>
        <Header />
        <div className="page" ref={pageInstance}>
          <ScrollRestoration />
          <Outlet />
        </div>
        <Footer />
      </article>
      <PMsgs />
    </div>
  );
});

export default Layout;
