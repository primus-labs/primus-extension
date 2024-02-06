import React, { memo, useCallback } from 'react';
import { DATASOURCEMAP } from '@/config/dataSource';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import type { SyntheticEvent } from 'react';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import connectData from '@/assets/newImg/dataSource/connectedData.svg';

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
const connectedList = [
  {
    address: '0xF795811af86E9f23A0c03dE5115398B8d4778eD4',
    origin: 'MetaMask',
    initTime: '1707101091114',
    updateTime: '1707201011114',
  },
  {
    address: '0x123411af86E9f23A0c03dE5115398B8d4778eD4',
    origin: 'OKX',
    initTime: '1707101091114',
    updateTime: '1707201011114',
  },
];
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const handleDetail = useCallback((i) => {
      onClick && onClick(i);
    }, []);
    const formatTime = (datastamp) => {
      return dayjs.utc(+datastamp).format('YYYY.MM.DD hh:mm');
    };
    return (
      <ul className="connectedDataCards">
        {connectedList.map((i) => {
          return (
            <li
              className="dataCard"
              onClick={() => {
                handleDetail(i);
              }}
            >
              <div className="brief">
                <img src={connectData} alt="" />
                <div className="introTxt">
                  <div className="title">
                    <span>Wallet Address: {i.address}</span>
                    <i className="iconfont iconDelete"></i>
                  </div>
                  <div className="desc">
                    <div className="origin">Fetching from {i.origin}</div>
                    <div className="time">{formatTime(i.updateTime)}</div>
                  </div>
                </div>
              </div>
              <PButton
                className="detailBtn"
                text="View more"
                type="text"
                onClick={() => {
                  handleDetail(i);
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
