import React, { memo, useCallback } from 'react';
import { DATASOURCEMAP } from '@/config/dataSource';
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
// const list = Object.values(DATASOURCEMAP);
const list = Object.values(DATASOURCEMAP);
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const handleConnect = useCallback((i) => {
      onClick && onClick(i)
    }, []);
    const handleDelete = useCallback((e: SyntheticEvent, i) => {
      e.stopPropagation()
    }, []);
    return (
      <ul className="dataSourceCards">
        {list.map((i) => {
          return (
            <li
              className="dataSourceCard"
              onClick={() => {
                handleConnect(i);
              }}
            >
              <div className="cardContent">
                <div className="header">
                  <PTag text="Assets Data" color="brand" />
                  <div className="connections">
                    <div className="num">
                      <i className="iconfont icon-iconConnection"></i>
                      <span>2</span>
                    </div>
                    <i
                      className="iconfont icon-iconDelete"
                      onClick={(e) => {
                        handleDelete(e, i);
                      }}
                    ></i>
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
