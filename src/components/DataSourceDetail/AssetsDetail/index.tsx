import React, { useMemo, useEffect, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';


import TokenTable from '@/components/TokenTable';
import iconAvatar from '@/assets/img/iconAvatar.png';
import iconCredCreate from '@/assets/img/iconCredCreate.svg';
import './index.sass';

import { setExSourcesAsync } from '@/store/actions';
import useUpdateAssetSource from '@/hooks/useUpdateAssetSources';
import DataUpdateBar from '@/components/DataSourceOverview/DataUpdateBar';
import { gte, div, formatNumeral } from '@/utils/utils';
import { BTC } from '@/config/constants';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { ExchangeMeta } from '@/config/constants';
import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceItem';

type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
  pnl?: string;
  label?: string;
  flexibleAccountTokenMap: AssetsMap;
  spotAccountTokenMap: AssetsMap;
  tokenPriceMap: object;
  tradingAccountTokenAmountObj: object;
};
export type DataSourceStorages = {
  binance?: any;
  okx?: any;
  kucoin?: any;
  twitter?: any;
  coinbase?: any;
  [propName: string]: any;
};
export type ExDataType = ExInfo & ExchangeMeta;

export type DataSourceType = {
  date: string;
  tokenListMap: AssetsMap;
  totalBalance: string;
  [propName: string]: any;
};

const AssetsDetail = memo(() => {
  const exSources = useSelector((state: UserState) => state.exSources);

  const dispatch: Dispatch<any> = useDispatch();
  const [fetchExDatasLoading, fetchExDatas] = useUpdateAssetSource();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sourceName = (searchParams.get('name') as string).toLowerCase();

  const dataSource = useMemo(() => {
    return exSources[sourceName] as ExDataType;
  }, [exSources, sourceName]);
  const btcPrice = useMemo(() => {
    if (typeof dataSource === 'object') {
      const originP =
        dataSource?.tokenPriceMap[BTC as keyof typeof dataSource.tokenPriceMap];
      return originP ? originP : null;
    } else {
      return null;
    }
  }, [dataSource]);
  const pnl = useMemo(() => {
    if (typeof dataSource === 'object') {
      const originPnl = dataSource?.pnl;
      const originPnlToFixed6 =
        originPnl && new BigNumber(Number(originPnl)).abs().toFixed();
      const formatPnl =
        originPnlToFixed6 &&
        formatNumeral(originPnlToFixed6, { decimalPlaces: 4 });
      return originPnl
        ? gte(Number(originPnl), 0)
          ? `+$${formatPnl}`
          : `-$${formatPnl}`
        : '--';
    } else {
      return '--';
    }
  }, [dataSource]);
  const totalAssetsBalance = useMemo(() => {
    if (typeof dataSource === 'object') {
      const totalBal = new BigNumber(dataSource.totalBalance);
      return `${totalBal.toFixed(2)}`;
    } else {
      return '0.00';
    }
  }, [dataSource]);
  const eqBtcNum = useMemo(() => {
    if (typeof dataSource === 'object' && typeof btcPrice === 'string') {
      const totalBal = new BigNumber(dataSource.totalBalance);
      const eqBtcNum = div(Number(totalBal), Number(btcPrice));
      return `${eqBtcNum.toFixed(6)}`;
    } else {
      return '--';
    }
  }, [dataSource, btcPrice]);

  const totalAssetsNo = useMemo(() => {
    if (typeof dataSource === 'object') {
      const num = Object.keys(dataSource.tokenListMap).length;
      return num;
    } else {
      return 0;
    }
  }, [dataSource]);
  const totalAssetsList = useMemo(() => {
    if (typeof dataSource === 'object') {
      const list = Object.values(dataSource.tokenListMap);
      return list;
    } else {
      return [];
    }
  }, [dataSource]);
  const flexibleAccountTokenMap = useMemo(() => {
    if (typeof dataSource === 'object') {
      const obj = dataSource.flexibleAccountTokenMap;
      return obj;
    } else {
      return undefined;
    }
  }, [dataSource]);
  const spotAccountTokenMap = useMemo(() => {
    if (typeof dataSource === 'object') {
      const obj = dataSource.spotAccountTokenMap;
      return obj;
    } else {
      return undefined;
    }
  }, [dataSource]);

  const handleBack = () => {
    navigate(-1);
  };
  const onUpdate = () => {
    dispatch(setExSourcesAsync());
  };
  const fetchExData = () => {
    !fetchExDatasLoading &&
      (fetchExDatas as (name: string) => void)(sourceName);
  };

  const navToCred = useCallback(() => {
    navigate('/cred?createFlag=true');
  }, [navigate]);
  const headerRightContent = useMemo(() => {
    return (
      <button className="tokenTableHeaderRight" onClick={navToCred}>
        <img src={iconCredCreate} alt="" />
        <span>Create Credential</span>
      </button>
    );
  }, [navToCred]);

  useEffect(() => {
    sourceName && fetchExData();
  }, [sourceName]);

  useEffect(() => {
    !fetchExDatasLoading && onUpdate();
  }, [fetchExDatasLoading]);

  return (
    <div className="assetsDetail">
      <div className="iconBackWrapper" onClick={handleBack}></div>
      <header>
        <img src={iconAvatar} alt="" className="avatar" />
        {typeof dataSource === 'object' && <h3>{dataSource?.label}</h3>}
        {typeof dataSource === 'object' && (
          <div className="descItems">
            <div className="descItem">
              <img src={dataSource?.icon} alt="" className="sourceIcon" />
              <div className="value">{dataSource?.name}</div>
            </div>
            <div className="descItem">
              <div className="label">Date: &nbsp;</div>
              <div className="value">{dataSource?.date}</div>
            </div>
          </div>
        )}
      </header>
      <section className="sourceStatisticsBar">
        <div className="descItem">
          <div className="inner">
            <div className="label">Est Total Value</div>
            <div className="value">${formatNumeral(totalAssetsBalance)}</div>
            <div className="btcValue">
              ≈ {formatNumeral(eqBtcNum, { decimalPlaces: 6 })} BTC
            </div>
          </div>
        </div>
        <div className="separtor"></div>
        <div className="descItem">
          <div className="inner">
            <div className="label">Assets No. </div>
            <div className="value">{totalAssetsNo}</div>
          </div>
        </div>
        <div className="separtor"></div>
        <div className="descItem">
          <div className="inner">
            <div className="label">PnL </div>
            <div className="value">{pnl}</div>
          </div>
        </div>
      </section>
      <TokenTable
        list={totalAssetsList}
        flexibleAccountTokenMap={flexibleAccountTokenMap}
        spotAccountTokenMap={spotAccountTokenMap}
        name={sourceName}
        headerRightContent={headerRightContent}
      />
      <DataUpdateBar
        type="Assets"
        onUpdate={onUpdate}
        sourceName={sourceName}
      />
    </div>
  );
});

export default AssetsDetail;
