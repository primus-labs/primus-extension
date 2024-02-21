import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {useSelector} from 'react-redux'
import { DATASOURCEMAP } from '@/config/dataSource';
import useAllSources from '@/hooks/useAllSources';
import type { UserState } from '@/types/store';
import type { DataSourceItemType } from '@/config/dataSource';
import PBack from '@/newComponents/PBack';
import PButton from '@/newComponents/PButton';
import PTag from '@/newComponents/PTag';
import ConnectedDataCards from '@/newComponents/DataSource/ConnectedDataCards';
import SupportedAttestationCards from '@/newComponents/DataSource/SupportedAttestationCards';
import empty from '@/assets/newImg/dataSource/empty.svg';
import './index.scss';
const DataSouces = Object.values(DATASOURCEMAP);

const DataSourceItem = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dataSourceName = searchParams.get('dataSourceName');
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const [sourceList, sourceMap, activeDataSouceUserInfo] =
    useAllSources(dataSourceName);
  console.log('activeDataSouceUserInfo', activeDataSouceUserInfo);
  const hasConnected = useMemo(() => {
    return !!activeDataSouceUserInfo?.name;
  }, [activeDataSouceUserInfo]);
  
  const activeDataSouceMetaInfo = useMemo(() => {
    var obj = DataSouces.find((i) => i.name === dataSourceName);
    return obj as DataSourceItemType;
  }, [dataSourceName]);
  const btnTxtEl = useMemo(() => {
    if (activeDataSouceMetaInfo.name === 'G Account') {
      return 'Connect by Auth';
    } else {
      return 'Connect by Web';
    }
  }, [activeDataSouceMetaInfo]);
  const handleConnect = useCallback(() => {
    const currRequestObj = webProofTypes.find(
      (r: any) => r.dataSource === dataSourceName?.toLocaleLowerCase()
    );
    // r.name === 'Account Ownership' &&
    chrome.runtime.sendMessage({
      type: 'dataSourceWeb',
      name: 'init',
      operation: 'connect',
      params: {
        ...currRequestObj,
      },
    });
  }, []);
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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
                <div className="name">{activeDataSouceMetaInfo.name}</div>
                <PTag text={`${activeDataSouceMetaInfo.type} Data`} color="brand" />
              </div>
              <div className="origin">
                {activeDataSouceMetaInfo.provider
                  ? ` Provide by ${activeDataSouceMetaInfo.provider}`
                  : 'By Community'}
              </div>
            </div>
            {hasConnected && (
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
                <SupportedAttestationCards />
              </div>
            </div>
          ) : (
            <div className="hasNoContent">
              <img src={empty} alt="" />
              <div className="introTxt">
                <div className="title">No data connected</div>
                <div className="desc">{activeDataSouceMetaInfo.unConnectTip}</div>
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
    </div>
  );
});

export default DataSourceItem;
