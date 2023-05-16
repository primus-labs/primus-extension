import React, { useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import { gte, div, formatNumeral } from '@/utils/utils';
import { BTC } from '@/utils/constants';
import type {
  AssetsMap,
} from '@/components/DataSourceOverview/DataSourceItem';
import TokenTable from '@/components/TokenTable';
import iconArrowLeft from '@/assets/img/iconArrowLeft2.svg';
import iconSuc from '@/assets/img/iconSuc.svg';
import iconAvatar from '@/assets/img/iconAvatar.png';
import './index.sass';
import useUpdateAssetSource from '@/hooks/useUpdateAssetSources'
import DataUpdateBar from '@/components/DataSourceOverview/DataUpdateBar'
import { useDispatch, useSelector } from 'react-redux';
import type { Dispatch } from 'react'
import { setExSourcesAsync } from '@/store/actions'
import type { UserState } from '@/store/reducers';
import type { ExchangeMeta } from '@/utils/constants'

type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
  pnl?: string;
  label?: string;
  flexibleAccountTokenMap: AssetsMap;
  spotAccountTokenMap: AssetsMap;
  tokenPriceMap: any
}
export type DataSourceStorages = {
  binance?: any,
  okx?: any,
  kucoin?: any,
  twitter?: any,
  coinbase?: any,
  [propName: string]: any
}
export type ExDataType = ExInfo & ExchangeMeta

export type DataSourceType = {
  date: string;
  tokenListMap: AssetsMap;
  totalBalance: string;
  [propName: string]: any;
};
interface AssetsDetailProps {
  onProve: (name: string) => void;
  assetsProveFlag: boolean;
  userProveFlag: boolean;
}
const proofList = ['Assets', 'Active User']
const AssetsDetail: React.FC<AssetsDetailProps> = ({
  onProve,
  assetsProveFlag,
  userProveFlag,
}) => {
  const dispatch: Dispatch<any> = useDispatch()
  const [fetchExDatasLoading, fetchExDatas] = useUpdateAssetSource()
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sourceName = (searchParams.get('name') as string).toLowerCase();
  const exSources = useSelector(
    (state: UserState) => state.exSources
  );
  const dataSource = useMemo(() => {
    return exSources[sourceName] as ExDataType
  }, [exSources, sourceName])

  const btcPrice = useMemo(() => {
    if (typeof dataSource === 'object') {
      const originP = dataSource?.tokenPriceMap[BTC];
      return originP
        ? originP
        : null;
    } else {
      return null;
    }
  }, [dataSource])
  const pnl = useMemo(() => {
    if (typeof dataSource === 'object') {
      const originPnl = dataSource?.pnl;
      const originPnlToFixed6 = originPnl && new BigNumber(Number(originPnl)).abs().toFixed()
      const formatPnl = originPnlToFixed6 && formatNumeral(originPnlToFixed6, { decimalPlaces: 4 })
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

  const handleProve = (item: string) => {
    // 'Assets', 'Active User'
    onProve(item);
  };


  const handleBack = () => {
    navigate(-1);
  };
  const onUpdate = () => {
    dispatch(setExSourcesAsync());
  }

  const fetchExData = () => {
    !fetchExDatasLoading && (fetchExDatas as (name: string) => void)(sourceName)
  }
  useEffect(() => {
    sourceName && fetchExData()
  }, [sourceName])

  useEffect(() => {
    !fetchExDatasLoading && onUpdate()
  }, [fetchExDatasLoading])
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
            <div className="btcValue">≈ {formatNumeral(eqBtcNum, { decimalPlaces: 6 })} BTC</div>
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
      <section className="proofsBar">
        {proofList.map((item) => {
          return (
            <div
              key={item}
              className="proofCard"
              onClick={() => handleProve(item)}
            >
              <div className="cardC">
                <div className="label">{item} Proof</div>
                {item === 'Active User' && userProveFlag && (
                  <img className="iconSuc" src={iconSuc} alt="" />
                )}
                {item === 'Assets' && assetsProveFlag && (
                  <img className="iconSuc" src={iconSuc} alt="" />
                )}
                <img className="iconArrow" src={iconArrowLeft} alt="" />
              </div>
            </div>
          );
        })}
      </section>
      <TokenTable list={totalAssetsList} flexibleAccountTokenMap={flexibleAccountTokenMap} spotAccountTokenMap={spotAccountTokenMap} name={sourceName} />
      <DataUpdateBar type='Assets' onUpdate={onUpdate} sourceName={sourceName} />
    </div>
  );
};

export default AssetsDetail;
