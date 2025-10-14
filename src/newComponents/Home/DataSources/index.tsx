import React, { memo, useCallback, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveConnectDataSource } from '@/store/actions';

import './index.scss';
import PButton from '@/newComponents/PButton';
import DataSourceBrief from '@/newComponents/DataSource/DataSourceBrief';
import PTooltip from '@/newComponents/PTooltip';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useAllSources from '@/hooks/useAllSources';
import useBreakPoint from '@/hooks/useBreakPoint';
import useWinWidth from '@/hooks/useWinWidth';
import { UserState } from '@/types/store';

const Overview = memo(() => {
  const breakPoint = useBreakPoint();
  const size = useWinWidth();
  const { sourceMap, sourceMap2 } = useAllSources();
  const dispatch = useDispatch();
  const activeConnectDataSource = useSelector(
    (state: UserState) => state.activeConnectDataSource
  );
  const [activeConnectDataSourceId, setActiveConnectDataSourceId] =
    useState<string>();
  const navigate = useNavigate();
  let dataSourceList = ['x', 'tiktok'];
  // if (size.width >= 1342) {
  //   dataSourceList = ['x', 'tiktok', 'binance', 'okx', 'bybit'];
  // } else
  if (size.width >= 1128) {
    dataSourceList = ['x', 'tiktok', 'binance', 'okx'];
  } else if (size.width >= 914) {
    dataSourceList = ['x', 'tiktok', 'binance'];
  }
  const checkIsConnectedDataSourceFn = useCallback(
    (i) => {
      let hasConnectCurrent = !!sourceMap2[i] && sourceMap2[i]?.expired !== '1';
      if (i === 'web3 wallet') {
        hasConnectCurrent =
          Object.keys(sourceMap.onChainAssetsSources).length > 0;
      }
      return hasConnectCurrent;
    },
    [sourceMap, sourceMap2]
  );
  const handleClick = useCallback((i) => {
    // setActiveConnectDataSourceId(i);
    // if (checkIsConnectedDataSourceFn(i)) {
    // navigate(`/datas/data?dataSourceId=${i}`);
    // } else {
    //   if (activeConnectDataSource.loading === 1) {
    //     return;
    //   } else {
    //     dispatch(
    //       setActiveConnectDataSource({
    //         dataSourceId: i,
    //         loading: 0,
    //       })
    //     );
    //   }
    // }
    // navigate(`/datas/data?dataSourceId=${i}`);
    navigate(`/Attestation?dataSourceId=${i}`);
  }, []);
  // const handleClick = useCallback(
  //   (i) => {
  //     // setActiveConnectDataSourceId(i);
  //     // if (checkIsConnectedDataSourceFn(i)) {
  //     // navigate(`/datas/data?dataSourceId=${i}`);
  //     // } else {
  //     //   if (activeConnectDataSource.loading === 1) {
  //     //     return;
  //     //   } else {
  //     //     dispatch(
  //     //       setActiveConnectDataSource({
  //     //         dataSourceId: i,
  //     //         loading: 0,
  //     //       })
  //     //     );
  //     //   }
  //     // }
  //   },
  //   [dispatch, sourceMap, sourceMap2, navigate, activeConnectDataSource]
  // );
  const handleClickCard = useCallback(
    (i) => {
      if (checkIsConnectedDataSourceFn(i)) {
        handleClick(i);
      }
    },
    [checkIsConnectedDataSourceFn, handleClick]
  );
  const handleMore = useCallback(() => {
    navigate('/Attestation');
  }, [navigate]);
  return (
    <div className="homeDataSources">
      <div className="title">
        <span>Verify Your Data</span>
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
              <div className="dataSourceItemTop">
                <DataSourceBrief id={i} />
                {sourceMap2[i]?.expired === '1' && (
                  <PTooltip title={`Login session expired`}>
                    <PButton
                      className="reconnectBtn"
                      type="icon"
                      icon={<i className="iconfont icon-iconInfo"></i>}
                      onClick={() => {
                        handleClick(i);
                      }}
                    />
                  </PTooltip>
                )}
              </div>
              <PButton
                className="connectBtn"
                text="Verify"
                type="text"
                loading={
                  activeConnectDataSource.dataSourceId === i &&
                  activeConnectDataSource.loading === 1
                }
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
