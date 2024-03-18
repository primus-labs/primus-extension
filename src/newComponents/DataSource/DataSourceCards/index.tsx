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

import './index.scss';

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
const list = Object.values(DATASOURCEMAP);
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeDataSourceName, setActiveDataSourceName] =
      useState<string>('');
    const { deleteFn: deleteDataSourceFn } =
      useDataSource(activeDataSourceName);
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
        // onClick && onClick(i);
        navigate(`/datas/data?dataSourceId=${i.id}`);
      },
      [navigate]
    );
    const handleDelete = useCallback(
      (i) => {
        setActiveDataSourceName(i.name);
        deleteDataSourceFn(i.name);
        // TODO-newui badge
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
        const lowerCaseSourceName = i.name.toLowerCase();
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
                          <PButton
                            className="reconnectBtn"
                            type="icon"
                            icon={<i className="iconfont icon-iconInfo"></i>}
                            onClick={() => {
                              handleConnect(i);
                            }}
                          />
                        )}
                        {sourceMap2[i.id]?.expired !== '1' && <PButton
                          className="deleteBtn"
                          type="icon"
                          icon={<i className="iconfont icon-iconDelete"></i>}
                          onClick={() => {
                            handleDelete(i);
                          }}
                        />}
                      </div>
                    )}
                  </div>
                  <DataSourceBrief id={i.id} />
                  <div className="desc">{i.desc}</div>
                </div>
                <PButton
                  className="connectBtn"
                  text="Connect"
                  type="text"
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
