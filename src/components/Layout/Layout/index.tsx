import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import PHeader from '@/components/Layout/PHeader';
import PageHeader from '@/components/Layout/PageHeader';
import BackgroundAnimation from '@/components/Layout/BackgroundAnimation';
import rem from '@/utils/rem.js';
import {
  setSysConfigAction,
  initSourceUpdateFrequencyActionAsync,
} from '@/store/actions';
import usePollingUpdateAllSources from '@/hooks/usePollingUpdateAllSources';
import { postMsg } from '@/utils/utils';
import { setProofTypesAsync } from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { ObjectType, SysConfigItem, GetSysConfigMsg } from '@/types/home';
import './index.sass';

const Layout = () => {
  const [isScroll, setIsScroll] = useState(false);

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const userPassword = useSelector((state: UserState) => state.userPassword);
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const pageHeaderWrapperClassName = useMemo(() => {
    let activeClassName = 'pageHeaderWrapper';
    if (isScroll) {
      activeClassName += ' scroll';
    }
    return activeClassName;
  }, [isScroll]);

  const dispatch: Dispatch<any> = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [startPollingSources] = usePollingUpdateAllSources();

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
    }
  }, [padoServicePort, userPassword]);

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
    if (activeSourceType !== 'All') {
      setIsScroll(false);
      if (document.documentElement.scrollTop > 0) {
        document.documentElement.scrollTo({
          top: 0,
          // behavior: 'smooth',
        });
      }
    }
  }, [activeSourceType]);
  useEffect(() => {
    window.onscroll = () => {
      if (activeSourceType !== 'All' || pathname !== '/datas') {
        setIsScroll(false);
        return;
      }
      var topScroll = document.documentElement.scrollTop || window.pageYOffset;
      if (topScroll >= 1) {
        setIsScroll(true);
      } else {
        setIsScroll(false);
      }
    };
    return () => {
      window.onscroll = () => {};
    };
  }, [activeSourceType, pathname]);
  useEffect(() => {
    dispatch(setProofTypesAsync());
  }, [dispatch]);
  useEffect(() => {
    dispatch(initSourceUpdateFrequencyActionAsync());
  }, [dispatch]);
  useEffect(() => {
    startPollingSources();
  }, [startPollingSources]);

  return (
    <div className="pageApp">
      <BackgroundAnimation />
      <div className="pageLayer">
        {['/', '/lock'].includes(pathname) ? (
          <header className="appHeader">
            <PHeader />
          </header>
        ) : (
          <div className={pageHeaderWrapperClassName}>
            <PageHeader />
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
