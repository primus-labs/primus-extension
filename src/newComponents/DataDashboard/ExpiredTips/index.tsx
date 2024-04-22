import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveConnectDataSource } from '@/store/actions';
import useAllSources from '@/hooks/useAllSources';
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';
import ConnectDataSource from '@/newComponents/DataSource/ConnectDataSource';
import './index.scss';
import { ONEMINUTE } from '@/config/constants';
import useInterval from '@/hooks/useInterval';
import { useSelector } from 'react-redux';

const ExpiredTips = memo(() => {
  const dispatch = useDispatch();
  const { sourceMap, sourceMap2 } = useAllSources();
  console.log('222ExpiredTips-sourceMap2', sourceMap2);
  const [showList, setShowList] = useState<string[]>([]);
  const activeConnectDataSource = useSelector(
    (state) => state.activeConnectDataSource
  );

  const checkFn = useCallback(async () => {
    const expiredDataSourceNames = Object.keys(sourceMap2).filter((i) => {
      return sourceMap2[i]?.expired === '1';
    });
    setShowList(expiredDataSourceNames);
  }, [sourceMap2]);
  const handleConnect = useCallback(
    (name) => {
      dispatch(
        setActiveConnectDataSource({
          dataSourceId: name,
          loading: 0,
        })
      );
    },
    [dispatch]
  );
  const handleClose = useCallback((name) => {
    setShowList((l) => {
      const newL = l.filter((i) => i !== name);
      return newL;
    });
  }, []);
  useInterval(checkFn, 5 * ONEMINUTE, true, true);
  useEffect(() => {
    if (activeConnectDataSource?.loading === 2) {
      checkFn();
    }
  }, [activeConnectDataSource, checkFn]);
  return showList?.length > 0 ? (
    <div className="expiredTips">
      <ul className="expiredTipItems">
        {showList.map((i) => {
          return (
            <li key={i} className="expiredTipItem">
              <div className="left">
                <i className="iconfont icon-iconInfoColorful"></i>
                <p>
                  {sourceMap2[i].name} data login session has expired. Please
                  reconnect the data source to get real-time information.
                </p>
              </div>
              <div className="right">
                <PButton
                  type="text2"
                  text="To connect"
                  onClick={() => {
                    handleConnect(i);
                  }}
                  className="connectBtn"
                />
                <PClose
                  onClick={() => {
                    handleClose(i);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <ConnectDataSource />
    </div>
  ) : (
    <></>
  );
});

export default ExpiredTips;
