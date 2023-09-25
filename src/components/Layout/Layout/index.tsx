import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

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
import useUpdateOnChainSources from '@/hooks/useUpdateOnChainSources';
import { postMsg } from '@/utils/utils';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { ObjectType, SysConfigItem, GetSysConfigMsg } from '@/types/home';
import './index.sass';
import LoseEfficacyDialog from '../LoseEfficacy';
import { updateAlgoUrl } from '@/config/envConstants';

const Layout = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const userPassword = useSelector((state: UserState) => state.userPassword);

  const dispatch: Dispatch<any> = useDispatch();
  const navigate = useNavigate();
  usePollingUpdateAllSources();
  const [updateOnChainLoading, updateOnChainFn] = useUpdateOnChainSources();

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
          //alert('getSysConfig network error');
          console.log('getSysConfig network error');
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
    const beforeunloadFn = () => {
      const msg = {
        fullScreenType: 'algorithm',
        reqMethodName: 'stop',
        params: {
          noRestart: true,
        },
      };
      postMsg(padoServicePort, msg);
    };
    window.addEventListener('beforeunload', beforeunloadFn);
    return () => {
      window.removeEventListener('beforeunload', beforeunloadFn);
    };
  }, [padoServicePort]);

  // useEffect(() => {
  //   dispatch(setExSourcesAsync());
  //   dispatch(setSocialSourcesAsync());
  //   dispatch(setKYCsAsync());
  //   dispatch(setProofTypesAsync());
  //   dispatch(initSourceUpdateFrequencyActionAsync());
  //   dispatch(initUserInfoActionAsync());
  //   dispatch(setCredentialsAsync());
  //   dispatch(initWalletAddressActionAsync());
  //   dispatch(initRewardsActionAsync());
  //   dispatch(setOnChainAssetsSourcesAsync());
  //   (updateOnChainFn as () => void)();
  // }, [dispatch, updateOnChainFn]);
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
    (updateOnChainFn as () => void)();
  }, [dispatch, updateOnChainFn]);
  useEffect(() => {
    initStoreData();
  }, [initStoreData]);

  useEffect(() => {
    if (pathname === '/datas') {
      updateAlgoUrl();
    }
  }, [pathname]);


  // const handlePageDecode = async () => {
  //   debugger
  //   const DYNAMIC_SCRIPT_ID = 'dynamic-script';
  //   async function isDynamicContentScriptRegistered() {
  //     const scripts = await chrome.scripting.getRegisteredContentScripts();
  //     return scripts.some((s) => s.id === DYNAMIC_SCRIPT_ID);
  //   }
  //   // Unregister the dynamic content script to avoid multiple injections.
  //   const dynamicContentScriptRegistered =
  //     await isDynamicContentScriptRegistered();
    
  //   if (dynamicContentScriptRegistered) {
  //     await chrome.scripting.unregisterContentScripts({
  //       ids: [DYNAMIC_SCRIPT_ID],
  //     });
  //   }

  //   // // Now, execute the script. We handle this in the service worker so we can
  //   // // wait for the tab to open and **then** inject our script.
  //   // chrome.runtime.sendMessage({
  //   //   name: 'inject-programmatic',
  //   //   options: { world: 'ISOLATED' },
  //   // });
  //   const matches = ['https://www.binance.com/zh-CN/my/dashboard'];
  //   await chrome.scripting.registerContentScripts([
  //     {
  //       id: 'dynamic-script',
  //       js: ['/content-script.js'],
  //       // persistAcrossSessions: false,
  //       matches: matches,
  //       // runAt: 'document_start',
  //       // allFrames: false,
  //       // world: 'ISOLATED',
  //     },
  //   ]);

  //   // Only open the page by default if the `matches` field hasn't been changed.
  //   if (matches.includes('https://www.binance.com/zh-CN/my/dashboard')) {
  //     await chrome.tabs.create({
  //       url: 'https://www.binance.com/zh-CN/my/dashboard',
  //     });
  //     // debugger
  //     // await chrome.runtime.sendMessage({
  //     //   name: 'inject-pagedecode',
  //     // });
  //   }
  // };


  const handlePageDecode = async () => {
    await chrome.runtime.sendMessage({
      name: 'inject-dynamic-pageDecode',
    });
  };
  const handlePageRequest = async () => {
    await chrome.runtime.sendMessage({
      name: 'pageDecode-send-request',
    });
  };

  return (
    <div className="pageApp">
      <BackgroundAnimation />
      <div className="pageLayer">
        <button
          className="openPageDataSource"
          onClick={handlePageDecode}
        >
          Open Binance
        </button>
        <button
          className="requestBtn"
          onClick={handlePageRequest}
        >
          Request
        </button>
        <ActiveHeader />
        <Outlet />
      </div>
      <LoseEfficacyDialog />
    </div>
  );
};

export default Layout;
