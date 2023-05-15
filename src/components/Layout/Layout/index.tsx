import React, { useEffect, useCallback, useState } from 'react';
import type { Dispatch } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import PHeader from '@/components/Layout/PHeader';
import PageHeader from '@/components/Layout/PageHeader';
import BackgroundAnimation from '@/components/Layout/BackgroundAnimation';
import rem from '@/utils/rem.js';
import { setSysConfigAction } from '@/store/actions';
import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';

import './index.sass';
type SysConfigItem = {
  configName: string;
  configValue: any;
};
type GetSysConfigMsg = {
  resMethodName: string;
  res: SysConfigItem[];
};
type ObjectType = {
  [propName: string]: any;
};
const Layout = () => {
  const [isScroll, setIsScroll] = useState(false);
  const dispatch: Dispatch<any> = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refreshDataFlag = searchParams.get('refreshData');

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const userPassword = useSelector((state: UserState) => state.userPassword);
  const location = useLocation();
  const pathname = location.pathname;
  const [updating, updateF] = useUpdateAllSources(true);

  // console.log('Layout', location.pathname)
  const getSysConfig = useCallback(async () => {
    const padoServicePortListener = async function (message: GetSysConfigMsg) {
      if (message.resMethodName === 'getSysConfig') {
        console.log('page_get:getSysConfig:', message.res);
        const configMap = message.res.reduce(
          (prev: ObjectType, curr: SysConfigItem) => {
            const { configName, configValue } = curr;
            prev[configName] = configValue;
            return prev;
          },
          {}
        );
        dispatch(setSysConfigAction(configMap));
      }
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);
    postMsg(padoServicePort, {
      fullScreenType: 'padoService',
      reqMethodName: 'getSysConfig',
    });
    console.log('page_send:getSysConfig request');
  }, [dispatch, padoServicePort]);
  const initPage = async () => {
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
    const padoServicePortListener = async function (message: any) {
      if (message.resMethodName === 'queryUserPassword') {
        console.log('page_get:queryUserPassword:', message.res);
        if (message.res) {
          (updateF as () => void)();
        }
      } else {
      }
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);
    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'queryUserPassword',
      params: {},
    };
    postMsg(padoServicePort, msg);
  };
  useEffect(() => {
    rem();
  }, []);

  useEffect(() => {
    getSysConfig();
  }, [getSysConfig]);
  useEffect(() => {
    if (refreshDataFlag) {
      (updateF as () => void)();
    }
  }, [refreshDataFlag, updateF]);
  const addDisconnectListener = () => {
    const onDisconnectFullScreen = (port: chrome.runtime.Port) => {
      console.log('onDisconnectFullScreen port in page', port);
      dispatch({
        type: 'setPort',
      });
    };
    padoServicePort.onDisconnect.addListener(onDisconnectFullScreen);
  };
  useEffect(() => {
    if (padoServicePort) {
      initPage();
      addDisconnectListener();
    }
    console.log('updated port in page layout', padoServicePort.name);
  }, [padoServicePort]);

  useEffect(() => {
    // const pageAppEl = document.getElementsByClassName('pageApp')[0];
    // const pageLayerEl = document.getElementsByClassName('pageLayer')[0];
    // const appContentEl = document.getElementsByClassName('appContent')[0];
    // const dataSourceListEl =
    //   document.getElementsByClassName('dataSourceList')[0];
    window.onscroll = () => {
      var topScroll = document.documentElement.scrollTop || window.pageYOffset;
      console.log('topScroll', topScroll);
      if (topScroll >= 83) {
        setIsScroll(true);
      } else {
        setIsScroll(false);
      }
    };
    return () => {
      window.onscroll = () => {};
    };
  }, []);

  return (
    <div className="pageApp">
      <BackgroundAnimation />
      <div className="pageLayer">
        {['/', '/lock'].includes(pathname) ? (
          <header className="appHeader">
            <PHeader />
          </header>
        ) : (
          <div
            className={
              isScroll ? 'pageHeaderWrapper scroll' : 'pageHeaderWrapper'
            }
          >
            <PageHeader />
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
