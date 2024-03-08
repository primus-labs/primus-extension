import React, { memo, useCallback } from 'react';
import './index.scss';
import PButton from '@/newComponents/PButton';
import DataSourceBrief from '@/newComponents/DataSource/DataSourceBrief';
import { useNavigate } from 'react-router-dom';

const Overview = memo(() => {
  const navigate = useNavigate();
  const dataSourceList = ['web3 wallet', 'x', 'tiktok', 'coinbase', 'binance'];
  const handleClick = useCallback(
    (link) => {
      navigate(link);
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
            <li className="dataSourceItem" key={k}>
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
    </div>
  );
});

export default Overview;
