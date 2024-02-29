import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DATASOURCEMAP } from '@/config/dataSource';
import useDataSource from '@/hooks/useDataSource';
import useAllSources from '@/hooks/useAllSources';
import type { SyntheticEvent } from 'react';
import type { UserState } from '@/types/store';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';

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
          const curName = i.showName ?? i.name;
          const lowerCaseName = curName.toLowerCase();
          return lowerCaseName.startsWith(dataSourceQueryStr);
        });
      }
      return newList;
    }, [list, dataSourceQueryStr, dataSourceQueryType]);
    const { sourceMap,sourceMap2 } = useAllSources();

    const handleConnect = useCallback(
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
      <ul className="dataSourceCards">
        {filterdList.map((i) => {
          return (
            <li
              className="dataSourceCard"
              onClick={() => {
                handleConnect(i);
              }}
              key={i.name}
            >
              <div className="cardContent">
                <div className="header">
                  <PTag text={`${i.type} Data`} color="brand" />
                  {connectionNumFn(i) > 0 && (
                    <div className="connections">
                      <div className="num">
                        <i className="iconfont icon-iconConnection"></i>
                        <span>{connectionNumFn(i)}</span>
                      </div>
                      <PButton
                        className="deleteBtn"
                        type="icon"
                        icon={<i className="iconfont icon-iconDelete"></i>}
                        onClick={() => {
                          handleDelete(i);
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="brief">
                  <img src={i.icon} alt="" />
                  <div className="intro">
                    <div className="name">{i?.showName ?? i.name}</div>
                    <div className="origin">
                      {i.provider
                        ? ` Provide by ${i.provider}`
                        : 'By Community'}
                    </div>
                  </div>
                </div>
                <div className="desc">
                  Support fetching token & NFT assets data for management and
                  attestation creation.
                </div>
              </div>
              <PButton
                className="connectBtn"
                text="Connect"
                type="text"
                onClick={() => {
                  handleConnect(i);
                }}
              />
            </li>
          );
        })}
      </ul>
    );
  }
);

export default Cards;
