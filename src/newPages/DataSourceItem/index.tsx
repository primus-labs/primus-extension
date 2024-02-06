import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DATASOURCEMAP } from '@/config/dataSource';
import PBack from '@/newComponents/PBack';
import PButton from '@/newComponents/PButton';
import PTag from '@/newComponents/PTag';
import ConnectedDataCards from '@/newComponents/DataSource/ConnectedDataCards'
import empty from '@/assets/newImg/dataSource/empty.svg';
import './index.scss';
const activeDataSouce = Object.values(DATASOURCEMAP)[0];

const DataSourceItem = memo(() => {
  const navigate = useNavigate();
  const [hasConnected, setHasConnected] = useState<boolean>(true);
  const handleConnect = useCallback(() => {}, []);
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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
                text="Connect by Web"
                size="s"
                onClick={handleConnect}
              />
            )}
          </div>
          {hasConnected ? (
            <div className="hasContent">
              <div className="connectedInfo sectionInfo">
                <h2 className="sectionTitle">Connected data</h2>
                <ConnectedDataCards/>
              </div>
              <div className="attestationTypes sectionInfo">
                <h2 className="sectionTitle">Create your attestation</h2>
              </div>
            </div>
          ) : (
            <div className="hasNoContent">
              <img src={empty} alt="" />
              <div className="introTxt">
                <div className="title">No data connected</div>
                <div className="desc">
                  You can fetch token & NFT assets data from your Web3 Wallet to
                  manage your assets or create attestations.
                </div>
              </div>
              <PButton
                className="connectBtn"
                text="Connect by Web"
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
