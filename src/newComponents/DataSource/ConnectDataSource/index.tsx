import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
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
import type { UserState } from '@/types/store';
interface PBackProps {
  dataSourceId: string;
}
const ConnectDataSource: React.FC = memo(({}) => {
  useConnectDataSourceByWeb();
  const { addMsg } = useMsgs();
  const authorize = useAuthorization();

  const dispatch = useDispatch();
  const [visibleConnectByWeb, setVisibleConnectByAPI] =
    useState<boolean>(false);
  const activeConnectDataSource = useSelector(
    (state) => state.activeConnectDataSource
  );
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const lowerCaseDataSourceName = useMemo(() => {
    return activeConnectDataSource?.dataSourceId;
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
    if (lowerCaseDataSourceName === 'web3 wallet') {
      await dispatch(
        setActiveConnectDataSource({
          loading: 1,
        })
      );
      await dispatch({ type: 'setRequireFetchAssets', payload: true });
      dispatch(setConnectWalletDialogVisibleAction(true));
      return;
    }
    if (activeConnectType === 'API') {
      await dispatch(
        setActiveConnectDataSource({
          loading: 1,
        })
      );
      setVisibleConnectByAPI(true);
    } else if (activeConnectType === 'Web') {
      const currRequestObj = webProofTypes.find(
        (r: any) => r.dataSource === lowerCaseDataSourceName
      );
      // TODO-newui
      if (lowerCaseDataSourceName === 'tiktok') {
        currRequestObj.datasourceTemplate.requests[0] = {
          name: 'first',
          url: 'https://www.tiktok.com/api/user/detail/',
          queryParams: ['WebIdLastTime'],
          method: 'GET',
          headers: ['User-Agent'],
          cookies: ['sessionid', 'tt-target-idc'],
        };
      }
      // TODO END
      chrome.runtime.sendMessage({
        type: 'dataSourceWeb',
        name: 'init',
        operation: 'connect',
        params: {
          ...currRequestObj,
        },
      });
    } else if (activeConnectType === 'Auth') {
      await dispatch(
        setActiveConnectDataSource({
          loading: 1,
        })
      );
      var authorizeSourceKey = lowerCaseDataSourceName.toUpperCase();
      authorize(authorizeSourceKey, () => {
        dispatch(setSocialSourcesAsync());
        addMsg({
          type: 'suc',
          title: 'Data connected!',
          link: `/datas/data?dataSourceId=${lowerCaseDataSourceName}`,
        });
        dispatch(
          setActiveConnectDataSource({
            loading: 2,
          })
        );
      });
    }
  }, [dispatch, lowerCaseDataSourceName, webProofTypes]);
  useEffect(() => {
    if (
      activeConnectDataSource?.dataSourceId &&
      activeConnectDataSource?.loading === 0
    ) {
      handleConnect();
    }
  }, [handleConnect, activeConnectDataSource]);
  useEffect(() => {
    if (activeConnectDataSource?.loading > 1) {
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
