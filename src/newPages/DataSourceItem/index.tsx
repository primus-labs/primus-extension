import React, { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveConnectDataSource } from '@/store/actions';
import { switchAccount } from '@/services/wallets/metamask';
import useDataSource from '@/hooks/useDataSource';
import useAuthorization from '@/hooks/useAuthorization';
import {
  setConnectWalletDialogVisibleAction,
} from '@/store/actions';
import { SUPPORTATTESTDATASOURCES } from '@/config/dataSource';
import type { Dispatch } from 'react';

import type { UserState } from '@/types/store';
import PBack from '@/newComponents/PBack';
import PButton from '@/newComponents/PButton';
import PTag from '@/newComponents/PTag';
import ConnectedAccountsCards from '@/newComponents/DataSource/ConnectedAccountsCards';
import SupportedAttestationCards from '@/newComponents/DataSource/SupportedAttestationCards';
import ConnectByAPI from '@/newComponents/DataSource/ConnectByAPI';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';
import './index.scss';
import useMsgs from '@/hooks/useMsgs';

const DataSourceItem = memo(() => {
  const { addMsg } = useMsgs();
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
  const [attestationPresets, setAttestationPresets] = useState<any>();

  const [visibleConnectByWeb, setVisibleConnectByAPI] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dataSourceName = searchParams.get('dataSourceId') as string;
  const lowerCaseDataSourceName = dataSourceName?.toLocaleLowerCase();

  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const activeConnectDataSource = useSelector(
    (state: UserState) => state.activeConnectDataSource
  );
  const {
    metaInfo: activeDataSouceMetaInfo,
    userInfo: activeDataSouceUserInfo,
    // deleteFn: deleteDataSourceFn,
  } = useDataSource(lowerCaseDataSourceName);
  const authorize = useAuthorization();
  const dispatch: Dispatch<any> = useDispatch();
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
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
  const handleConnect = useCallback(
    async (from = 1) => {
      if (activeConnectDataSource.loading === 1) {
        return;
      } else {
        await dispatch(
          setActiveConnectDataSource({
            loading: 1,
          })
        );
        if (lowerCaseDataSourceName === 'web3 wallet') {
          await dispatch({ type: 'setRequireFetchAssets', payload: true });
          // from: 1 first connect wallet,2:switch wallet account connect
          if (from === 2) {
            if (connectedWallet?.provider) {
              switchAccount(connectedWallet?.provider);
            } else {
              dispatch(setConnectWalletDialogVisibleAction(1));
            }
            return;
          } else {
            dispatch(setConnectWalletDialogVisibleAction(1));
            return;
          }
        }
      }
    },
    [dispatch, connectedWallet, activeConnectDataSource]
  );
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSubmitConnectByAPI = useCallback(() => {
    setVisibleConnectByAPI(false);
  }, []);
  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);
  const handleSubmitAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);
  const handleAttest = useCallback(
    (i) => {
      if (attestLoading === 1) {
        addMsg({
          type: 'info',
          title: 'Cannot process now',
          desc: 'Another attestation task is running. Please try again later.',
        });
        return;
      } else {
        setVisibleAssetDialog(i.attestationType);
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
      }
    },
    [attestLoading]
  );
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
                <div className="name">{activeDataSouceMetaInfo?.name}</div>
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
                loading={activeConnectDataSource.loading === 1}
                size="s"
                onClick={() => {
                  handleConnect(2);
                }}
              />
            )}
          </div>

          <div className="hasContent">
            {hasConnected && (
              <div className="connectedInfo sectionInfo">
                <h2 className="sectionTitle">Connected data</h2>
                <ConnectedAccountsCards />
              </div>
            )}
            {SUPPORTATTESTDATASOURCES.includes(dataSourceName) && (
              <div className="attestationTypes sectionInfo">
                <h2 className="sectionTitle">Create your attestation</h2>
                <SupportedAttestationCards onClick={handleAttest} />
              </div>
            )}
          </div>
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
