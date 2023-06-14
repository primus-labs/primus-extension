import React, { useEffect, useCallback, useState, useMemo } from 'react';
import type { Dispatch } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ONEMINUTE } from '@/config/constants';
import {
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import PHeader from '@/components/Layout/PHeader';
import PageHeader from '@/components/Layout/PageHeader';
import BackgroundAnimation from '@/components/Layout/BackgroundAnimation';
import rem from '@/utils/rem.js';
import {
  setSysConfigAction,
  initSourceUpdateFrequencyActionAsync,
} from '@/store/actions';
import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';
import {
  setExSourcesAsync,
  setSocialSourcesAsync,
  setProofTypesAsync,
} from '@/store/actions';

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
  const [pollingSourcesTimer, setPollingSourcesTimer] = useState<any>();
  const [isScroll, setIsScroll] = useState(false);
  const dispatch: Dispatch<any> = useDispatch();
  const navigate = useNavigate();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const userPassword = useSelector((state: UserState) => state.userPassword);
  const sourceUpdateFrequency = useSelector(
    (state: UserState) => state.sourceUpdateFrequency
  );
  const location = useLocation();
  const pathname = location.pathname;
  const [updating, updateF] = useUpdateAllSources(true);
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);
  const hasDataSources = useMemo(() => {
    const allDataSources = [
      ...Object.values(exSources),
      ...Object.values(socialSources),
    ];
    return allDataSources.length > 0;
  }, [exSources, socialSources]);
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
  // const getProofTypesConfig = useCallback(async () => {
  //   const padoServicePortListener = async function (message: GetSysConfigMsg) {
  //     if (message.resMethodName === 'getProofTypes') {
  //       const { res } = message;
  //       console.log('page_get:getProofTypes:', res);
  //       if (res) {
  //         const filteredTypes = res.filter((i: any) => i?.display === 0);
  //         dispatch(setProofTypesAction(filteredTypes));
  //       } else {
  //         alert('getProofTypes network error');
  //       }
  //     }
  //   };
  //   padoServicePort.onMessage.addListener(padoServicePortListener);
  //   postMsg(padoServicePort, {
  //     fullScreenType: 'padoService',
  //     reqMethodName: 'getProofTypes',
  //   });
  //   console.log('page_send:getProofTypes request');
  // }, [dispatch, padoServicePort]);
  const pollingDataSources = useCallback(() => {
    // console.log(
    //   '111111pollingDataSources',
    //   sourceUpdateFrequency,
    //   pollingSourcesTimer
    // );
    if (pollingSourcesTimer) {
      clearInterval(pollingSourcesTimer);
    }
    const timer = setInterval(() => {
      (updateF as () => void)();
    }, Number(sourceUpdateFrequency) * ONEMINUTE);
    setPollingSourcesTimer(timer);
    (updateF as () => void)();
  // }, [pollingSourcesTimer, sourceUpdateFrequency, updateF]);
  }, [sourceUpdateFrequency, updateF]);
  useEffect(() => {
    console.log('pollingSourcesTimer', pollingSourcesTimer);
  }, [pollingSourcesTimer]);
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
  useEffect(() => {
    if (userPassword && hasDataSources) {
      pollingDataSources();
    }
  }, [userPassword, hasDataSources, pollingDataSources]);
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
  const pageHeaderWrapperClassName = useMemo(() => {
    let activeClassName = 'pageHeaderWrapper';
    if (isScroll) {
      activeClassName += ' scroll';
    }
    return activeClassName;
  }, [isScroll]);
  useEffect(() => {
    dispatch(setProofTypesAsync());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      pollingSourcesTimer && clearInterval(pollingSourcesTimer);
    };
  }, [pollingSourcesTimer]);
  useEffect(() => {
    dispatch(initSourceUpdateFrequencyActionAsync());
  }, [dispatch]);
 useEffect(() => {
   chrome.storage.local.remove(['dataSourcesUpdateFrequency']);
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
