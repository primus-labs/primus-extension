import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DATASOURCEMAP } from '@/config/dataSource';
import useAllSources from '@/hooks/useAllSources';
import type { UserState } from '@/types/store';
import type { DataSourceItemType } from '@/config/dataSource';
import PBack from '@/newComponents/PBack';
import PButton from '@/newComponents/PButton';
import PTag from '@/newComponents/PTag';
import ConnectedDataCards from '@/newComponents/DataSource/ConnectedDataCards';
import SupportedAttestationCards from '@/newComponents/DataSource/SupportedAttestationCards';
import ConnectByAPI from '@/newComponents/DataSource/ConnectByAPI';
import empty from '@/assets/newImg/dataSource/empty.svg';
import './index.scss';
const DataSouces = Object.values(DATASOURCEMAP);

const DataSourceItem = memo(() => {
  const [visibleConnectByWeb, setVisibleConnectByAPI] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dataSourceName = searchParams.get('dataSourceName');
  const lowerCaseDataSourceName = dataSourceName?.toLocaleLowerCase();
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const [sourceList, sourceMap, activeDataSouceUserInfo] = useAllSources(
    lowerCaseDataSourceName
  );
  console.log('activeDataSouceUserInfo', activeDataSouceUserInfo);
  const hasConnected = useMemo(() => {
    return !!activeDataSouceUserInfo?.name;
  }, [activeDataSouceUserInfo]);

  const activeDataSouceMetaInfo = useMemo(() => {
    var obj = DataSouces.find((i) => i.name === dataSourceName);
    return obj as DataSourceItemType;
  }, [dataSourceName]);
  const btnTxtEl = useMemo(() => {
    // if (activeDataSouceMetaInfo.name === 'G Account') {
    //   return 'Connect by Auth';
    // } else {
    //   return 'Connect by Web';
    // }
    return 'Connect by ' + activeDataSouceMetaInfo?.connectType;
  }, [activeDataSouceMetaInfo]);
  const handleConnect = useCallback(() => {
    if (activeDataSouceMetaInfo?.connectType === 'API') {
      setVisibleConnectByAPI(true)
    } else if (activeDataSouceMetaInfo?.connectType === 'Web') {
      const currRequestObj = webProofTypes.find(
        (r: any) => r.dataSource === lowerCaseDataSourceName
      );

      // TODO
      if (lowerCaseDataSourceName === "tiktok") {
        currRequestObj.datasourceTemplate.requests[1].url = "https://www.tiktok.com/api/user/detail/";
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
    }
  }, []);
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  const handleCloseConnectByAPI = useCallback(() => {
    setVisibleConnectByAPI(false)
  }, [])
  const handleSubmitConnectByAPI = useCallback(() => {
     setVisibleConnectByAPI(false);
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
                <div className="name">{activeDataSouceMetaInfo.name}</div>
                <PTag
                  text={`${activeDataSouceMetaInfo.type} Data`}
                  color="brand"
                />
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
          onClose={handleCloseConnectByAPI}
          onSubmit={handleSubmitConnectByAPI}
        />
      )}
    </div>
  );
});

export default DataSourceItem;
