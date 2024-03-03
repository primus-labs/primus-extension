import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import useDataSource from '@/hooks/useDataSource';
import useAuthorization from '@/hooks/useAuthorization';
import {
  setSocialSourcesAsync,
  setConnectWalletDialogVisibleAction,
} from '@/store/actions';
import { DATASOURCEMAP } from '@/config/dataSource';
import type { Dispatch } from 'react';

import type { UserState } from '@/types/store';
import type { DataSourceItemType } from '@/config/dataSource';
import PBack from '@/newComponents/PBack';
import PButton from '@/newComponents/PButton';
import PTag from '@/newComponents/PTag';
import ConnectedDataCards from '@/newComponents/DataSource/ConnectedDataCards';
import SupportedAttestationCards from '@/newComponents/DataSource/SupportedAttestationCards';
import ConnectByAPI from '@/newComponents/DataSource/ConnectByAPI';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';
import empty from '@/assets/newImg/dataSource/empty.svg';
import './index.scss';
const DataSouces = Object.values(DATASOURCEMAP);

const DataSourceItem = memo(() => {
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
  const [attestationPresets, setAttestationPresets] = useState<any>();

  const [visibleConnectByWeb, setVisibleConnectByAPI] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dataSourceName = searchParams.get('dataSourceId') as string;
  const lowerCaseDataSourceName = dataSourceName?.toLocaleLowerCase();

  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const {
    metaInfo: activeDataSouceMetaInfo,
    userInfo: activeDataSouceUserInfo,
    // deleteFn: deleteDataSourceFn,
  } = useDataSource(lowerCaseDataSourceName);
  const authorize = useAuthorization();
  const dispatch: Dispatch<any> = useDispatch();
  const activeConnectType = useMemo(() => {
    return activeDataSouceMetaInfo?.connectType;
  }, [activeDataSouceMetaInfo]);

  const hasConnected = useMemo(() => {
    if (lowerCaseDataSourceName === 'web3 wallet') {
      return Object.values(activeDataSouceUserInfo).length > 0;
    } else {
      return activeDataSouceUserInfo?.name;
    }
  }, [activeDataSouceUserInfo]);

  const btnTxtEl = useMemo(() => {
    return activeConnectType ? 'Connect by ' + activeConnectType : 'Connect';
  }, [activeDataSouceMetaInfo]);
  const handleConnect = useCallback(async () => {
    if (activeDataSouceMetaInfo.name === 'Web3 Wallet') {
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

      // r.name === 'Account Ownership' &&
      chrome.runtime.sendMessage({
        type: 'dataSourceWeb',
        name: 'init',
        operation: 'connect',
        params: {
          ...currRequestObj,
        },
      });
    } else if (activeConnectType === 'Auth') {
      //  if (item.type === 'Social') {
      var authorizeSourceKey = lowerCaseDataSourceName.toUpperCase();
      // if (authorizeSourceKey === 'G ACCOUNT') {
      //   authorizeSourceKey = 'GOOGLE';
      // }
      authorize(authorizeSourceKey, () => {
        dispatch(setSocialSourcesAsync());
      });
      //  } else if (item.type === 'Identity') {
      //    // TODO
      //    setActiveSource(item);
      //    setStep(0);
      //    setKYCDialogVisible(true);
      //  }
    }
  }, [activeDataSouceMetaInfo, dispatch]);
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSubmitConnectByAPI = useCallback(() => {
    setVisibleConnectByAPI(false);
  }, []);
  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);
  const handleSubmitAssetDialog = useCallback(() => {}, []);
  const handleAttest = useCallback((i) => {
    setVisibleAssetDialog(i.attestationType)
    const presetsP = Object.keys({
      verificationContent: '',
      verificationValue: '',
      // account: ''
    }).reduce(
      (prev, curr) => {
        if (i[curr]) {
          prev[curr] = i[curr];
        }
        return prev;
      },
      { dataSourceId: lowerCaseDataSourceName }
    );
    setAttestationPresets(presetsP);
  }, []);
  return (
    <div className="pageDataSourceItem">
      <div className="pageContent">
        <div className="backWrapper" onClick={handleBack}>
          <PBack onBack={() => {}} />
          <span>Back</span>
        </div>
        <div className="pageDataSourceItemContent">
          <div className="dataSourceBrief">
            <div className="introTxt">
              <div className="title">
                <div className="name">
                  {activeDataSouceMetaInfo?.showName ??
                    activeDataSouceMetaInfo?.name}
                </div>
                <PTag
                  text={`${activeDataSouceMetaInfo?.type} Data`}
                  color="brand"
                />
              </div>
              <div className="origin">
                {activeDataSouceMetaInfo?.provider
                  ? ` Provide by ${activeDataSouceMetaInfo.provider}`
                  : 'By Community'}
              </div>
            </div>
            {hasConnected && lowerCaseDataSourceName === 'web3 wallet' && (
              <PButton
                className="connectBtn"
                text={btnTxtEl}
                size="s"
                onClick={handleConnect}
              />
            )}
          </div>
          {hasConnected ? (
            <div className="hasContent">
              <div className="connectedInfo sectionInfo">
                <h2 className="sectionTitle">Connected data</h2>
                <ConnectedDataCards />
              </div>
              <div className="attestationTypes sectionInfo">
                <h2 className="sectionTitle">Create your attestation</h2>
                <SupportedAttestationCards onClick={handleAttest} />
              </div>
            </div>
          ) : (
            <div className="hasNoContent">
              <img src={empty} alt="" />
              <div className="introTxt">
                <div className="title">No data connected</div>
                <div className="desc">
                  {activeDataSouceMetaInfo.unConnectTip}
                </div>
              </div>
              <PButton
                className="connectBtn"
                text={btnTxtEl}
                size="s"
                onClick={handleConnect}
              />
            </div>
          )}
        </div>
      </div>
      {visibleConnectByWeb && (
        <ConnectByAPI
          onClose={handleSubmitConnectByAPI}
          onSubmit={handleSubmitConnectByAPI}
          sourceName={lowerCaseDataSourceName}
        />
      )}
      {visibleAssetDialog && (
        <CreateZkAttestation
          presets={attestationPresets}
          type={visibleAssetDialog}
          onClose={handleCloseAssetDialog}
          onSubmit={handleSubmitAssetDialog}
        />
      )}
    </div>
  );
});

export default DataSourceItem;
