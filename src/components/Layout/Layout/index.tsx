import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';

import ActiveHeader from '@/components/Layout/ActiveHeader';
import BackgroundAnimation from '@/components/Layout/BackgroundAnimation';
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
import usePollingUpdateAllSources from '@/hooks/usePollingUpdateAllSources';
import { postMsg } from '@/utils/utils';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { ObjectType, SysConfigItem, GetSysConfigMsg } from '@/types/home';
import './index.sass';
import LoseEfficacyDialog from '../LoseEfficacy';

const Layout = () => {
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const userPassword = useSelector((state: UserState) => state.userPassword);

  const dispatch: Dispatch<any> = useDispatch();
  const navigate = useNavigate();
  usePollingUpdateAllSources();

  const getSysConfig = useCallback(async () => {
    const padoServicePortListener = async function (message: GetSysConfigMsg) {
      if (message.resMethodName === 'getSysConfig') {
        const { res } = message;
        console.log('page_get:getSysConfig:', res);
        if (res) {
          const configMap = res.reduce(
            (prev: ObjectType, curr: SysConfigItem) => {
              const { configName, configValue } = curr;
              prev[configName] = configValue;
              return prev;
            },
            {}
          );
          dispatch(setSysConfigAction(configMap));
        } else {
          alert('getSysConfig network error');
        }
      }
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);
    postMsg(padoServicePort, {
      fullScreenType: 'padoService',
      reqMethodName: 'getSysConfig',
    });
    console.log('page_send:getSysConfig request');
  }, [dispatch, padoServicePort]);
  const initPage = useCallback(async () => {
    if (padoServicePort) {
      if (userPassword) {
        const msg2 = {
          fullScreenType: 'wallet',
          reqMethodName: 'resetUserPassword',
          params: {
            password: userPassword,
          },
        };
        postMsg(padoServicePort, msg2);
      }

      const padoServicePortListener2 = async function (message: any) {
        if (message.resType === 'lock') {
          navigate('/lock');
        }
      };
      padoServicePort.onMessage.addListener(padoServicePortListener2);

      const padoServicePortListener3 = async function (message: any) {
        if (message.resMethodName === 'queryUserPassword') {
          if (message.res) {
            await dispatch({
              type: 'setUserPassword',
              payload: message.res,
            });
          }
          let { keyStore } = await chrome.storage.local.get(['keyStore']);
          if (keyStore) {
            if (!message.res) {
              navigate('/lock');
            } else {
              // navigate('/datas');
            }
          }
        } else {
        }
        padoServicePort.onMessage.removeListener(padoServicePortListener3);
      };
      padoServicePort.onMessage.addListener(padoServicePortListener3);
      const msg = {
        fullScreenType: 'wallet',
        reqMethodName: 'queryUserPassword',
        params: {},
      };
      postMsg(padoServicePort, msg);
    }
  }, [padoServicePort, userPassword, dispatch, navigate]);

  const addDisconnectListener = useCallback(() => {
    const onDisconnectFullScreen = (port: chrome.runtime.Port) => {
      console.log('onDisconnectFullScreen port in page', port);
      dispatch({
        type: 'setPort',
      });
    };
    padoServicePort.onDisconnect.addListener(onDisconnectFullScreen);
  }, [dispatch, padoServicePort.onDisconnect]);

  useEffect(() => {
    rem();
  }, []);
  useEffect(() => {
    getSysConfig();
  }, [getSysConfig]);
  useEffect(() => {
    initPage();
    addDisconnectListener();
  }, [initPage, addDisconnectListener]);
  useEffect(() => {
    console.log('updated port in page layout', padoServicePort.name);
  }, [padoServicePort]);

  useEffect(() => {
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
    // chrome.storage.local.remove(['onChainAssetsSources']);
  }, [dispatch]);

  return (
    <div className="pageApp">
      <BackgroundAnimation />
      <div className="pageLayer">
        <ActiveHeader />
        <Outlet />
      </div>
      <LoseEfficacyDialog/>
    </div>
  );
};

export default Layout;
