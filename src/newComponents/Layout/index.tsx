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
import { DATASOURCEMAP } from '@/config/dataSource';
import { ETHSIGNEVENTNAME, BASEVENTNAME } from '@/config/events';
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
    // Compatible with old attestations
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    const newCredentialObj = JSON.parse(JSON.stringify(credentialObj));
    for (const credentialKey of Object.keys(credentialObj)) {
      const i = newCredentialObj[credentialKey];
      const compareRes =
        i.credVersion && compareVersions('1.0.5', i.credVersion); // TODO-newui!!!
      // google attestation has no set credVersion
      if (!i.credVersion || compareRes > 0) {
        // attestation credVersion < '1.0.5'
        if (i.type === 'ASSETS_PROOF') {
          i.attestationType = 'Assets Verification';
          i.verificationContent = 'Assets Proof';
          i.verificationValue = i.baseValue;

          if (!i.provided || i?.provided?.length === 0) {
            delete newCredentialObj[credentialKey];
          }
        } else if (i.type === 'TOKEN_HOLDINGS') {
          i.attestationType = 'Assets Verification';
          i.verificationContent = 'Token Holding';
          i.verificationValue = i.holdingToken;
          if (!i.provided || i?.provided?.length === 0) {
            delete newCredentialObj[credentialKey];
          }
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
          if (uiContent === 'X Followers') {
            i.attestationType = 'Social Connections';
            i.verificationContent = 'X Followers';
            i.verificationValue = i.baseValue;
          }
        } else if (i.type === 'UNISWAP_PROOF') {
          delete newCredentialObj[credentialKey];
          // i.attestationType = 'On-chain Transaction';
          // i.verificationContent = 'Largest ETH/USDC Uniwap Transaction';
          // i.verificationValue = i.dataToBeSigned.content;
        }
        if (i.did) {
          delete newCredentialObj[credentialKey];
        }
      }
    }
    await chrome.storage.local.set({
      credentials: JSON.stringify(newCredentialObj),
    });
    // Compatible with old data sources (include x,zan)
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Assets'
    );
    let dataSourceStoragesRes = await chrome.storage.local.get(
      sourceNameList.concat(['x', 'zan'])
    );
    for (const dataSourceKey of Object.keys(dataSourceStoragesRes)) {
      if (dataSourceStoragesRes[dataSourceKey]) {
        const currentDataSourceObj = JSON.parse(
          dataSourceStoragesRes[dataSourceKey]
        );
        if (currentDataSourceObj?.version) {
          const compareRes = compareVersions(
            '1.0.1',
            currentDataSourceObj?.version
          );
          if (compareRes > 0) {
            // dataSource version < '1.0.1'
            await chrome.storage.local.remove([dataSourceKey]);
          }
        }
      }
    }
    // Compatible with old event participation
    let eventsParticipationStoragesRes = await chrome.storage.local.get(
      sourceNameList.concat([BASEVENTNAME, ETHSIGNEVENTNAME])
    );
    for (const eventsParticipationKey of Object.keys(
      eventsParticipationStoragesRes
    )) {
      if (eventsParticipationStoragesRes[eventsParticipationKey]) {
        const eventsParticipationObj = JSON.parse(
          eventsParticipationStoragesRes[eventsParticipationKey]
        );
        if (
          'steps' in eventsParticipationObj ||
          'address' in eventsParticipationObj
        ) {
          await chrome.storage.local.remove([eventsParticipationKey]);
        }
      }
    }

    // await chrome.storage.local.remove(sourceNameList.concat(['x', 'zan']));
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
