import React, { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DATASOURCEMAP } from '@/config/dataSource';
import useDataSource from '@/hooks/useDataSource';
import type { SyntheticEvent } from 'react';

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
    const [activeDataSourceName, setActiveDataSourceName] =
      useState<string>('');
    const {
      metaInfo: activeDataSouceMetaInfo,
      userInfo: activeDataSouceUserInfo,
      deleteFn: deleteDataSourceFn,
    } = useDataSource(activeDataSourceName);
    const navigate = useNavigate();
    const handleConnect = useCallback(
      (i) => {
        // onClick && onClick(i);
        navigate(`/datas/data?dataSourceName=${i.name}`);
      },
      [navigate]
    );
    const handleDelete = useCallback(
      (i) => {
        setActiveDataSourceName(i.name);
        setTimeout(() => {
          debugger;
          deleteDataSourceFn(i.name);
        }, 2000);

        // TODO-newui badge
      },
      [deleteDataSourceFn]
    );

    return (
      <ul className="dataSourceCards">
        {list.map((i) => {
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
                  <div className="connections">
                    <div className="num">
                      <i className="iconfont icon-iconConnection"></i>
                      <span>2</span>
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
                </div>
                <div className="brief">
                  <img src={i.icon} alt="" />
                  <div className="intro">
                    <div className="name">{i.name}</div>
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
