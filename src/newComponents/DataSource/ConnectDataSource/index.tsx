import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import './index.scss';
import ConnectByAPI from '../ConnectByAPI';
import { useDispatch, useSelector } from 'react-redux';
import {
  setConnectWalletDialogVisibleAction,
  setSocialSourcesAsync,
  setActiveConnectDataSource,
} from '@/store/actions';
import useConnectDataSourceByWeb from '@/hooks/useConnectDataSourceByWeb';
import useMsgs from '@/hooks/useMsgs';
import useDataSource from '@/hooks/useDataSource';
import useAuthorization from '@/hooks/useAuthorization';
import { DATASOURCEMAP } from '@/config/dataSource2';
import { webDataSourceTemplate } from '@/config/webDataSourceTemplate';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
interface PBackProps {
  dataSourceId: string;
}
const ConnectDataSource: React.FC = memo(({}) => {
  const { pathname } = useLocation();
  useConnectDataSourceByWeb();
  const { addMsg } = useMsgs();
  const authorize = useAuthorization();

  const dispatch: Dispatch<any> = useDispatch();
  const [visibleConnectByWeb, setVisibleConnectByAPI] =
    useState<boolean>(false);
  const activeConnectDataSource = useSelector(
    (state: UserState) => state.activeConnectDataSource
  );
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const lowerCaseDataSourceName = useMemo(() => {
    return activeConnectDataSource?.dataSourceId as string;
  }, [activeConnectDataSource]);
  const activeDataSouceMetaInfo = useMemo(() => {
    if (lowerCaseDataSourceName) {
      return DATASOURCEMAP[lowerCaseDataSourceName];
    } else {
      return {};
    }
  }, [lowerCaseDataSourceName]);
  const handleSubmitConnectByAPI = useCallback(() => {
    setVisibleConnectByAPI(false);
  }, []);
  const activeConnectType = useMemo(() => {
    return activeDataSouceMetaInfo?.connectType;
  }, [activeDataSouceMetaInfo]);
  const handleConnect = useCallback(async () => {
    await dispatch(
      setActiveConnectDataSource({
        loading: 1,
      })
    );
    if (lowerCaseDataSourceName === 'web3 wallet') {
      await dispatch({ type: 'setRequireFetchAssets', payload: true });
      dispatch(setConnectWalletDialogVisibleAction(1));
      return;
    }
    if (activeConnectType === 'API') {
      setVisibleConnectByAPI(true);
    } else if (activeConnectType === 'Web') {
      let currRequestObj = webProofTypes.find(
        (r: any) => r.dataSource === lowerCaseDataSourceName
      );
      /*if (lowerCaseDataSourceName === 'tiktok') {
        currRequestObj.datasourceTemplate.requests[0] = {
          name: 'first',
          url: 'https://www.tiktok.com/api/user/detail/',
          queryParams: ['WebIdLastTime'],
          method: 'GET',
          headers: ['User-Agent'],
          cookies: ['sessionid', 'tt-target-idc'],
        };
      }*/
      
      if (!currRequestObj) {
        currRequestObj = webDataSourceTemplate[lowerCaseDataSourceName];
      }
      chrome.runtime.sendMessage({
        type: 'dataSourceWeb',
        name: 'init',
        operation: 'connect',
        params: {
          ...currRequestObj,
        },
      });
    } else if (activeConnectType === 'Auth') {
      var authorizeSourceKey = lowerCaseDataSourceName.toUpperCase();
      authorize(authorizeSourceKey, () => {
        dispatch(setSocialSourcesAsync());
        let msgObj = {
          type: 'suc',
          title: 'Data connected!',
          desc: '',
          link: `/datas/data?dataSourceId=${lowerCaseDataSourceName}`,
        };
        if (!pathname.startsWith('/datas')) {
          msgObj.desc = 'See details in the Data Source page.';
        }
        addMsg(msgObj);
        dispatch(
          setActiveConnectDataSource({
            loading: 2,
          })
        );
      });
    }
  }, [dispatch, lowerCaseDataSourceName, webProofTypes, pathname]);
  useEffect(() => {
    if (
      activeConnectDataSource?.dataSourceId &&
      activeConnectDataSource?.loading === 0
    ) {
      handleConnect();
    }
  }, [handleConnect, activeConnectDataSource]);
  useEffect(() => {
    if (activeConnectDataSource?.loading && activeConnectDataSource?.loading > 1) {
      dispatch(
        setActiveConnectDataSource({
          loading: 0,
          dataSourceId: undefined,
        })
      );
    }
  }, [activeConnectDataSource?.loading, dispatch]);
  //await dispatch(
  //   setActiveConnectDataSource({
  //     loading: 1,
  //   })
  // );
  return (
    <div className="ConnectDataSource">
      {visibleConnectByWeb && (
        <ConnectByAPI
          onClose={handleSubmitConnectByAPI}
          onSubmit={handleSubmitConnectByAPI}
          sourceName={lowerCaseDataSourceName}
        />
      )}
    </div>
  );
});

export default ConnectDataSource;
