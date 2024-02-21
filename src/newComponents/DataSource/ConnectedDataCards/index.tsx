import React, { memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import { DATASOURCEMAP } from '@/config/dataSource';
import useAllSources from '@/hooks/useAllSources';
import { eventReport } from '@/services/api/usertracker';
import {
  setExSourcesAsync,
  setSocialSourcesAsync,
  setKYCsAsync,
  setCredentialsAsync,
  setOnChainAssetsSourcesAsync,
} from '@/store/actions';
import type { SyntheticEvent } from 'react';
import type { Dispatch } from 'react';
import type { DataSourceItemType } from '@/config/dataSource';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import connectData from '@/assets/newImg/dataSource/connectedData.svg';

import './index.scss';

const DataSouces = Object.values(DATASOURCEMAP);

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
    const lowerCaseDataSourceName = dataSourceName?.toLowerCase();
    const dispatch: Dispatch<any> = useDispatch();
    const [sourceList, sourceMap, activeDataSouceUserInfo] = useAllSources(
      lowerCaseDataSourceName
    );
    const activeDataSouceMetaInfo = useMemo(() => {
      var obj = DataSouces.find((i) => i.name === dataSourceName);
      return obj as DataSourceItemType;
    }, [dataSourceName]);
    const connectedList = useMemo(() => {
      // const list = [
      //   {
      //     address: '0xF795811af86E9f23A0c03dE5115398B8d4778eD4',
      //     origin: 'MetaMask',
      //     initTime: '1707101091114',
      //     updateTime: '1707201011114',
      //   },
      //   {
      //     address: '0x123411af86E9f23A0c03dE5115398B8d4778eD4',
      //     origin: 'OKX',
      //     initTime: '1707101091114',
      //     updateTime: '1707201011114',
      //   },
      // ];
      // const list2 = [
      //   {
      //     account: 'xxxx@gmail.com',
      //     origin: 'Web',
      //     initTime: '1707101091114',
      //     updateTime: '1707201011114',
      //   },
      // ];
      // const list3 = [
      //   {
      //     userName: 'Alex',
      //     origin: 'Web',
      //     initTime: '1707101091114',
      //     updateTime: '1707201011114',
      //   },
      // ];
      // const list4 = [
      //   {
      //     emailAddress: 'xxxx@gmail.com',
      //     origin: 'Web',
      //     initTime: '1707101091114',
      //     updateTime: '1707201011114',
      //   },
      // ];

      // if (dataSourceName === 'Web3 Wallet') return list;
      // if (dataSourceName === 'Binance') return list2;
      // if (dataSourceName === 'X' || dataSourceName === 'TikTok') return list3;
      // if (dataSourceName === 'G Account') return list4;
      // return [];
      // TODO-newui
      if (activeDataSouceUserInfo) {
        return [
          {
            account: 'xxxx@gmail.com',
            origin: 'Web',
            initTime: '1707101091114',
            updateTime: '1707201011114',
          },
        ];
      } else {
        return [];
      }
    }, [activeDataSouceUserInfo]);
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

    const handleDelete = async ( i: any) => {
      // Delete credentials storage related to the exchange
      const { credentials: credentialsStr } = await chrome.storage.local.get([
        'credentials',
      ]);
      const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
      let newCredentialObj = { ...credentialObj };
      Object.keys(credentialObj).forEach((key) => {
        if (lowerCaseDataSourceName === credentialObj[key].source) {
          const curCred = newCredentialObj[key];
          if (!curCred.provided) {
            delete newCredentialObj[key];
          }
        }
      });
      await chrome.storage.local.set({
        credentials: JSON.stringify(newCredentialObj),
      });
      // Delete on-chain datas

      // dispatch action & report event
      dispatch(setCredentialsAsync());
      if (activeDataSouceMetaInfo?.type === 'Assets') {
        // Delete data source storage
        if (
          lowerCaseDataSourceName &&
          lowerCaseDataSourceName !== 'Web3 Wallet'
        ) {
          await chrome.storage.local.remove([lowerCaseDataSourceName]);
        }
        // TODO-newui
        // if (i.name.startsWith('0x')) {
        if (lowerCaseDataSourceName === 'Web3 Wallet') {
          const { onChainAssetsSources: onChainAssetsSourcesStr } =
            await chrome.storage.local.get(['onChainAssetsSources']);
          const onChainAssetsSourcesObj = onChainAssetsSourcesStr
            ? JSON.parse(onChainAssetsSourcesStr)
            : {};
          let newOnChainAssetsSourcesObj = { ...onChainAssetsSourcesObj };
          // key account address
          // if (newOnChainAssetsSourcesObj[key]) {
          //   delete newOnChainAssetsSourcesObj[key];
          // }
          await chrome.storage.local.set({
            onChainAssetsSources: JSON.stringify(newOnChainAssetsSourcesObj),
          });

          dispatch(setOnChainAssetsSourcesAsync());
          return eventReport({
            eventType: 'DATA_SOURCE_DELETE',
            rawData: {
              type: 'Assets',
              dataSource: 'onchain-ConnectWallet',
            },
          });
        } else {
          dispatch(setExSourcesAsync());
          return eventReport({
            eventType: 'DATA_SOURCE_DELETE',
            rawData: {
              type: activeDataSouceMetaInfo?.type,
              dataSource: lowerCaseDataSourceName,
            },
          });
        }
      } else {
        if (activeDataSouceMetaInfo?.type === 'Social') {
          dispatch(setSocialSourcesAsync());
        } else if (activeDataSouceMetaInfo?.type === 'Humanity') {
          dispatch(setKYCsAsync());
        }
        return eventReport({
          eventType: 'DATA_SOURCE_DELETE',
          rawData: {
            type: activeDataSouceMetaInfo?.type,
            dataSource: lowerCaseDataSourceName,
          },
        });
      }
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
              key={i.initTime}
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
