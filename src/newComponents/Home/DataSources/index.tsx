import React, { memo, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveConnectDataSource } from '@/store/actions';
import { DATASOURCEMAP } from '@/config/dataSource2';

import './index.scss';
import PButton from '@/newComponents/PButton';
import DataSourceBrief from '@/newComponents/DataSource/DataSourceBrief';
import ConnectDataSource from '@/newComponents/DataSource/ConnectDataSource';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useAllSources from '@/hooks/useAllSources';

const Overview = memo(() => {
  const { sourceMap, sourceMap2 } = useAllSources();
  const dispatch = useDispatch();
  const [activeConnectDataSourceId, setActiveConnectDataSourceId] =
    useState<string>();
  const navigate = useNavigate();
  const dataSourceList = ['web3 wallet', 'x', 'tiktok', 'binance', 'okx'];
  const checkIsConnectedDataSourceFn = useCallback(
    (i) => {
      let hasConnectCurrent = !!sourceMap2[i];
      if (i === 'web3 wallet') {
        hasConnectCurrent =
          Object.keys(sourceMap.onChainAssetsSources).length > 0;
      }
      return hasConnectCurrent;
    },
    [sourceMap, sourceMap2]
  );
  const handleClick = useCallback(
    (i) => {
      // setActiveConnectDataSourceId(i);
      if (checkIsConnectedDataSourceFn(i)) {
        navigate(`/datas/data?dataSourceId=${i}`);
      } else {
        dispatch(
          setActiveConnectDataSource({
            dataSourceId: i,
            loading: 0,
          })
        );
      }
    },
    [dispatch, sourceMap, sourceMap2, navigate]
  );
  const handleClickCard = useCallback(
    (i) => {
      if (checkIsConnectedDataSourceFn(i)) {
        handleClick(i);
      }
    },
    [checkIsConnectedDataSourceFn, handleClick]
  );
  const handleMore = useCallback(() => {
    navigate('/datas');
  }, [navigate]);
  return (
    <div className="homeDataSources">
      <div className="title">
        <span>Data Sources</span>
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
                handleClickCard(i);
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
      <ConnectDataSource />
    </div>
  );
});

export default Overview;
