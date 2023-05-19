import React, { useEffect, useCallback, useState, useMemo } from 'react';
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
import { setExSourcesAsync, setSocialSourcesAsync } from '@/store/actions';

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
    if (!updating) {
      dispatch(setExSourcesAsync());
      dispatch(setSocialSourcesAsync());
    }
  }, [updating, dispatch]);

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
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  useEffect(() => {
    if (activeSourceType !== 'All') {
      setIsScroll(false);
      if (document.documentElement.scrollTop > 0) {
        document.documentElement.scrollTo({
          top: 0,
          behavior: 'smooth',
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
  const pageHeaderWrapperClassName = useMemo(() => {
    let activeClassName = 'pageHeaderWrapper';
    if (isScroll) {
      activeClassName += ' scroll animate__animated animate__slideInDown';
    }
    return activeClassName;
  }, [isScroll]);
  return (
    <div className="pageApp">
      <BackgroundAnimation />
      <div className="pageLayer">
        {['/', '/lock'].includes(pathname) ? (
          <header className="appHeader">
            <PHeader />
          </header>
        ) : 
          <div className={pageHeaderWrapperClassName}>
            <PageHeader />
          </div>
        }
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
