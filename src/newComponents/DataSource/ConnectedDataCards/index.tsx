import React, { memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import { DATASOURCEMAP } from '@/config/dataSource';
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

const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const [searchParams] = useSearchParams();
    const dataSourceName = searchParams.get('dataSourceName');
    const connectedList = useMemo(() => {
      const list = [
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
      const list2 = [
        {
          account: 'xxxx@gmail.com',
          origin: 'Web',
          initTime: '1707101091114',
          updateTime: '1707201011114',
        },
      ];
      const list3 = [
        {
          userName: 'Alex',
          origin: 'Web',
          initTime: '1707101091114',
          updateTime: '1707201011114',
        },
      ];
      const list4 = [
        {
          emailAddress: 'xxxx@gmail.com',
          origin: 'Web',
          initTime: '1707101091114',
          updateTime: '1707201011114',
        },
      ];

      if (dataSourceName === 'Web3 Wallet') return list;
      if (dataSourceName === 'Binance') return list2;
      if (dataSourceName === 'X' || dataSourceName === 'TikTok') return list3;
      if (dataSourceName === 'G Account') return list4;
      return [];
    }, []);
    const handleDetail = useCallback((i) => {
      onClick && onClick(i);
    }, []);
    const formatTime = (datastamp) => {
      return dayjs.utc(+datastamp).format('YYYY.MM.DD hh:mm');
    };
    const titleElFn = useCallback((i) => {
      if (i.name === 'Web3 Wallet') {
        return <span>Wallet Address: {i.address}</span>;
      } else if (i.name === 'X' || dataSourceName === 'TikTok') {
        return <span>User Name: {i.userName}</span>;
      } else if (dataSourceName === 'G Account') {
        return <span>Email address: {i.EmailAddress}</span>;
      } else {
        return <span>Account ID: {i.account}</span>;
      }
      //  if (i.name === 'Binance')
    }, []);
    const handleDelete = (i:any) => {};
    return (
      <ul className="connectedDataCards">
        {connectedList.map((i) => {
          return (
            <li
              className="dataCard"
              onClick={() => {
                handleDetail(i);
              }}
              key={i.account}
            >
              <div className="brief">
                <img src={connectData} alt="" />
                <div className="introTxt">
                  <div className="title">
                    {titleElFn(i)}

                    <PButton
                      className="deleteBtn"
                      type="icon"
                      icon={<i className="iconfont icon-iconDelete"></i>}
                      onClick={() => {
                        handleDelete(i);
                      }}
                    />
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
