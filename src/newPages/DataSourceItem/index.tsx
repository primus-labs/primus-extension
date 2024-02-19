import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DATASOURCEMAP } from '@/config/dataSource';
import useAllSources from '@/hooks/useAllSources';

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
  const [sourceList, sourceMap,activeSourceInfo] = useAllSources('binance');
  console.log(111, sourceList, sourceMap, activeSourceInfo);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dataSourceName = searchParams.get('dataSourceName');
  const [hasConnected, setHasConnected] = useState<boolean>(true);
  const handleConnect = useCallback(() => {}, []);
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  const activeDataSouce = useMemo(() => {
    var obj = DataSouces.find((i) => i.name === dataSourceName);
    return obj as DataSourceItemType;
  }, [dataSourceName]);
  const btnTxtEl = useMemo(() => {
    if (activeDataSouce.name === 'G Account') {
      return 'Connect by Auth';
    } else {
      return 'Connect by Web';
    }
  }, [activeDataSouce]);

  return (
    <div className="pageDataSourceItem">
      <div className="pageContent">
        <div className="backWrapper">
          <PBack onBack={handleBack} />
          <span>Back</span>
        </div>
        <div className="pageDataSourceItemContent">
          <div className="dataSourceBrief">
            <div className="introTxt">
              <div className="title">
                <div className="name">{activeDataSouce.name}</div>
                <PTag text={`${activeDataSouce.type} Data`} color="brand" />
              </div>
              <div className="origin">
                {activeDataSouce.provider
                  ? ` Provide by ${activeDataSouce.provider}`
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
                <div className="desc">{activeDataSouce.unConnectTip}</div>
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
