import React, { memo, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import useDataSource from '@/hooks/useDataSource';
import { getAccount } from '@/utils/utils';
import type { Dispatch } from 'react';
import PButton from '@/newComponents/PButton';
import connectData from '@/assets/newImg/dataSource/connectedData.svg';

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

const ConnectedAccountsCards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const { addMsg, deleteMsg } = useMsgs();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dataSourceName = searchParams.get('dataSourceId') as string;
    const lowerCaseDataSourceName = dataSourceName?.toLowerCase();
    const dispatch: Dispatch<any> = useDispatch();
    const {
      metaInfo: activeDataSouceMetaInfo,
      userInfo: activeDataSouceUserInfo,
      deleteFn: deleteDataSourceFn,
    } = useDataSource(lowerCaseDataSourceName);
    console.log('222activeDataSouceUserInfo', activeDataSouceUserInfo);
    const connectedList = useMemo(() => {
      // TODO-newui
      if (activeDataSouceUserInfo) {
        var account = '';
        if (lowerCaseDataSourceName === 'web3 wallet') {
          const list = Object.values(activeDataSouceUserInfo).map((i: any) => ({
            account: i.address,
            origin: 'Metamsk', // TODO-newui
            initTime: i.timestamp,
          }));
          return list;
        } else {
          account = getAccount(
            activeDataSouceMetaInfo,
            activeDataSouceUserInfo
          );

          return [
            {
              account,
              origin: activeDataSouceMetaInfo.connectType,
              initTime: activeDataSouceUserInfo.timestamp,
              // updateTime: '1707201011114',
            },
          ];
        }
      } else {
        return [];
      }
    }, [activeDataSouceUserInfo, activeDataSouceMetaInfo]);
    const handleDetail = useCallback(
      (i) => {
        // onClick && onClick(i);
        navigate('/dataDashboard');
      },
      [navigate]
    );
    const formatTime = (datastamp) => {
      return dayjs.utc(+datastamp).format('YYYY.MM.DD hh:mm');
    };
    const titleElFn = useCallback((i) => {
      if (activeDataSouceMetaInfo.connectType === 'API') {
        return <span>API Key: {i.account}</span>;
      } else {
        var activeLabel = 'User Name';
        if (['binance'].includes(lowerCaseDataSourceName)) {
          activeLabel = 'UserID';
        }
        if (['okx'].includes(lowerCaseDataSourceName)) {
          activeLabel = 'Account';
        }
        if (
          ['x', 'tiktok', 'zan', 'discord'].includes(lowerCaseDataSourceName)
        ) {
          activeLabel = 'User Name';
        }
        if (['google'].includes(lowerCaseDataSourceName)) {
          activeLabel = 'Email address';
        }
        if (['web3 wallet'].includes(lowerCaseDataSourceName)) {
          activeLabel = 'Wallet Address';
        }
        return (
          <span>
            {activeLabel}:{' '}
            {`${lowerCaseDataSourceName === 'x' ? '@' : ''}${i.account}`}
          </span>
        );
      }
    }, []);

    const handleDelete = useCallback(
      async (i: any) => {
        if (lowerCaseDataSourceName === 'web3 wallet') {
          await deleteDataSourceFn(i.account);
        } else {
          await deleteDataSourceFn(lowerCaseDataSourceName);
        }
        const msgId = await addMsg({
          type: 'info',
          title: 'X data deleted',
          showTime: 5000,
        });
        setTimeout(() => {
          deleteMsg(msgId);
        }, 5000);
      },
      [deleteDataSourceFn]
    );
    return (
      <ul className="connectedDataCards">
        {connectedList.map((i) => {
          return (
            <li className="dataCard" key={i.initTime}>
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
                    <div className="time">{formatTime(i.initTime)}</div>
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

export default ConnectedAccountsCards;
