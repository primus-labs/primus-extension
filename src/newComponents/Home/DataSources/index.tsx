import React, { memo, useCallback, useState } from 'react';
import { DATASOURCEMAP } from '@/config/dataSource2';

import './index.scss';
import PButton from '@/newComponents/PButton';
import DataSourceBrief from '@/newComponents/DataSource/DataSourceBrief';
import ConnectDataSource from '@/newComponents/DataSource/ConnectDataSource';
import { useNavigate } from 'react-router-dom';

const Overview = memo(() => {
  const [activeConnectDataSourceId, setActiveConnectDataSourceId] =
    useState<string>();
  const navigate = useNavigate();
  const dataSourceList = ['web3 wallet', 'x', 'tiktok', 'coinbase', 'binance'];
  const handleClick = useCallback(
    (i) => {
      setActiveConnectDataSourceId(i);
    },
    [navigate]
  );
  const handleMore = useCallback(() => {
    navigate('/datas');
  }, [navigate]);
  return (
    <div className="homeDataSources">
      <div className="title">
        <h2>Data Sources</h2>
        <PButton
          className="moreBtn"
          text="View More"
          type="text"
          onClick={handleMore}
        />
      </div>
      <ul className="dataSourceItems">
        {dataSourceList.map((i, k) => {
          return (
            <li
              className="dataSourceItem"
              key={k}
              onClick={() => {
                handleClick(i);
              }}
            >
              <DataSourceBrief id={i} />
              <PButton
                className="connectBtn"
                text="Connect"
                type="text"
                onClick={() => {
                  handleClick(i);
                }}
              />
            </li>
          );
        })}
      </ul>
      {activeConnectDataSourceId && (
        <ConnectDataSource dataSourceId={activeConnectDataSourceId} />
      )}
    </div>
  );
});

export default Overview;
