import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveConnectDataSource } from '@/store/actions';
import { DATASOURCEMAP } from '@/config/dataSource';
import useDataSource from '@/hooks/useDataSource';
import useAllSources from '@/hooks/useAllSources';
import type { SyntheticEvent } from 'react';
import type { UserState } from '@/types/store';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import DataSourceBrief from '../DataSourceBrief';
import ConnectDataSource from '../ConnectDataSource';
import PTooltip from '@/newComponents/PTooltip';

import './index.scss';
import useMsgs from '@/hooks/useMsgs';

type NavItem = {
  type: string;
  icon: any;
  desc: any;
  name: string;

  importType?: string;
  provider?: string;
};
interface PDropdownProps {
  onClick?: (item: NavItem) => void;
  // list: NavItem[];
}
const list = Object.values(DATASOURCEMAP).filter((i) => !i.hidden);
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const { addMsg } = useMsgs();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeDataSourceName, setActiveDataSourceName] =
      useState<string>('');
    const { deleteFn: deleteDataSourceFn } =
      useDataSource(activeDataSourceName);
    const activeConnectDataSource = useSelector(
      (state: UserState) => state.activeConnectDataSource
    );
    const dataSourceQueryStr = useSelector(
      (state: UserState) => state.dataSourceQueryStr
    );
    const dataSourceQueryType = useSelector(
      (state: UserState) => state.dataSourceQueryType
    );
    const filterdList = useMemo(() => {
      var newList = list;
      if (dataSourceQueryType && dataSourceQueryType !== 'All') {
        newList = list.filter((i) => {
          return i.type === dataSourceQueryType;
        });
      }
      if (dataSourceQueryStr) {
        newList = list.filter((i) => {
          const curName = i.name;
          const lowerCaseName = curName.toLowerCase();
          return lowerCaseName.startsWith(dataSourceQueryStr);
        });
      }
      return newList;
    }, [list, dataSourceQueryStr, dataSourceQueryType]);
    const { sourceMap, sourceMap2 } = useAllSources();

    const handleDetail = useCallback(
      (i) => {
        // if (sourceMap2[i.id]?.expired === '1') {
        //   if (activeConnectDataSource.loading === 1) {
        //     return;
        //   } else {
        //     dispatch(
        //       setActiveConnectDataSource({
        //         dataSourceId: i.id,
        //         loading: 0,
        //       })
        //     );
        //   }
        // } else {
          navigate(`/datas/data?dataSourceId=${i.id}`);
        // }
      },
      [navigate, activeConnectDataSource]
    );
    const handleDelete = useCallback(
      async (i) => {
        setActiveDataSourceName(i.id);
        await deleteDataSourceFn(i.id);
        addMsg({
          type: 'info',
          title: `${DATASOURCEMAP[i.id].name} data deleted`,
          showTime: 5000,
        });
      },
      [deleteDataSourceFn]
    );
    const handleConnect = useCallback(
      (i) => {
        // setActiveConnectDataSourceId(i);
        dispatch(
          setActiveConnectDataSource({
            dataSourceId: i.id,
            loading: 0,
          })
        );
      },
      [dispatch]
    );
    const connectionNumFn = useCallback(
      (i) => {
        const lowerCaseSourceName = i.id.toLowerCase();
        if (lowerCaseSourceName === 'web3 wallet') {
          return Object.values(sourceMap.onChainAssetsSources).length;
        } else {
          if (sourceMap2?.[lowerCaseSourceName]) {
            return 1;
          } else {
            return 0;
          }
        }
      },
      [sourceMap2, sourceMap]
    );

    return (
      <div className="dataSourceCardsWrapper">
        <ul className="dataSourceCards">
          {filterdList.map((i) => {
            return (
              <li className="dataSourceCard" key={i.name}>
                <div className="cardContent">
                  <div className="header">
                    <PTag text={`${i.type} Data`} color="brand" />
                    {connectionNumFn(i) > 0 && (
                      <div className="connections">
                        <div className="num">
                          <i className="iconfont icon-iconConnection"></i>
                          <span>{connectionNumFn(i)}</span>
                        </div>
                        {sourceMap2[i.id]?.expired === '1' && (
                          <PTooltip title={`Login session expired`}>
                            <PButton
                              className="reconnectBtn"
                              type="icon"
                              icon={<i className="iconfont icon-iconInfo"></i>}
                              onClick={() => {
                                handleConnect(i);
                              }}
                            />
                          </PTooltip>
                        )}
                        {sourceMap2[i.id]?.expired !== '1' && (
                          <PButton
                            className="deleteBtn"
                            type="icon"
                            icon={<i className="iconfont icon-iconDelete"></i>}
                            onClick={() => {
                              handleDelete(i);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <DataSourceBrief id={i.id} />
                  <div className="desc">{i.desc}</div>
                </div>
                <PButton
                  className="connectBtn"
                  text="Detail"
                  type="text"
                  loading={
                    activeConnectDataSource.dataSourceId === i.id &&
                    activeConnectDataSource.loading === 1
                  }
                  onClick={() => {
                    handleDetail(i);
                  }}
                />
              </li>
            );
          })}
        </ul>
        <ConnectDataSource />
      </div>
    );
  }
);

export default Cards;
