import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import './index.scss';
import ConnectByAPI from '../ConnectByAPI';
import { useDispatch, useSelector } from 'react-redux';
import {
  setConnectWalletDialogVisibleAction,
  setSocialSourcesAsync,
} from '@/store/actions';
import useDataSource from '@/hooks/useDataSource';
import useAuthorization from '@/hooks/useAuthorization';
import {DATASOURCEMAP} from '@/config/dataSource2'
import type { UserState } from '@/types/store';
interface PBackProps {
  dataSourceId: string;
}
const ConnectDataSource: React.FC<PBackProps> = memo(
  ({ dataSourceId: lowerCaseDataSourceName }) => {
    const authorize = useAuthorization();
    const activeDataSouceMetaInfo = DATASOURCEMAP[lowerCaseDataSourceName]
   
    const dispatch = useDispatch();
    const [visibleConnectByWeb, setVisibleConnectByAPI] =
      useState<boolean>(false);
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );
    const handleSubmitConnectByAPI = useCallback(() => {
      setVisibleConnectByAPI(false);
    }, []);
    const activeConnectType = useMemo(() => {
      return activeDataSouceMetaInfo?.connectType;
    }, [activeDataSouceMetaInfo]);
    const handleConnect = useCallback(async () => {
      
      if (lowerCaseDataSourceName === 'web3 wallet') {
        await dispatch({ type: 'setRequireFetchAssets', payload: true });
        dispatch(setConnectWalletDialogVisibleAction(true));
        return;
      }
      if (activeConnectType === 'API') {
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
        var authorizeSourceKey = lowerCaseDataSourceName.toUpperCase();
        authorize(authorizeSourceKey, () => {
          dispatch(setSocialSourcesAsync());
        });
      }
    }, [dispatch]);
    useEffect(() => {
      if (lowerCaseDataSourceName) {
        handleConnect();
      }
    }, [handleConnect, lowerCaseDataSourceName]);
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
  }
);

export default ConnectDataSource;
