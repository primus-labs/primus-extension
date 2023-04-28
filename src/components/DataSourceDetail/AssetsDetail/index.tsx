import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import { add, gte, div, postMsg } from '@/utils/utils';
import type {
  TokenMap,
  AssetsMap,
} from '@/components/DataSourceOverview/DataSourceItem';
import { getSingleStorageSyncData } from '@/utils/utils';
import { DATASOURCEMAP } from '@/utils/constants';
import TokenTable from '@/components/TokenTable';
import iconArrowRight from '@/assets/img/iconArrowRight.svg';
import iconSuc from '@/assets/img/iconSuc.svg';
import iconAvatar from '@/assets/img/iconAvatar.svg';
import iconClock from '@/assets/img/iconClock.svg';
import './index.sass';
import useExSource from '@/hooks/useExSource';
import Binance from '@/services/exchange/binance';
import { useSelector } from 'react-redux'
import type { UserState } from '@/store/reducers'
export type DataSourceType = {
  date: string;
  tokenListMap: AssetsMap;
  totalBalance: string; // TODO format amount
  [propName: string]: any;
};
interface AssetsDetailProps {
  onProve: (name: string) => void;
  assetsProveFlag: boolean;
  userProveFlag: boolean;
}
const AssetsDetail: React.FC<AssetsDetailProps> = ({
  onProve,
  assetsProveFlag,
  userProveFlag,
}) => {
  const padoServicePort = useSelector((state: UserState) => state.padoServicePort)
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sourceName = (searchParams.get('name') as string).toLowerCase();
  const [dataSource, getDataSource] = useExSource();
  const [btcPrice, setBtcPrice] = useState<string>();
  const [apiKey, setApiKey] = useState<string>();
  const [proofList, setProofList] = useState(['Assets', 'Active User']);
  const pnl = useMemo(() => {
    if (typeof dataSource === 'object') {
      const originPnl = dataSource?.pnl;
      return originPnl
        ? gte(Number(originPnl), 0)
          ? `+$${new BigNumber(Number(originPnl)).toFixed(4)}`
          : `-$${new BigNumber(Number(originPnl)).abs().toFixed(4)}`
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
      return '0.00';
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
  const formatApiKey = useMemo(() => {
    if (apiKey) {
      return apiKey.substring(0, 8);
    }
    return '';
  }, [apiKey]);
  const handleProve = (item: string) => {
    // 'Assets', 'Active User'
    onProve(item);
  };

  const getApiKey = useCallback(
    async (sourceName: string) => {
      const storageKey = sourceName + 'cipher';
      const msg: any = {
        fullScreenType: 'storage',
        type: 'get',
        key: storageKey,
      };
      postMsg(padoServicePort, msg)
      const padoServicePortListener = async function (message: any) {
        // console.log(`page_get:storeg-${storageKey}:`, message.res);
        if (message.resType === `get` && message.key === storageKey) {
          const { apiKey } = message.value;
          setApiKey(apiKey);
        }
      };
      padoServicePort.onMessage.addListener(padoServicePortListener);
    },
    [padoServicePort]
  );
  const getBTCPrice = async () => {
    const p = await new Binance({}).getTokenPrice('BTC');
    setBtcPrice(p);
  };
  useEffect(() => {
    getApiKey(sourceName);
    (getDataSource as (name: string) => void)(sourceName);
  }, [sourceName, getDataSource, getApiKey]);

  useEffect(() => {
    getBTCPrice();
  }, []);
  const handleBack = () => {
    navigate(-1);
  };
  return (
    <div className="assetsDetail">
      <div className="iconBackWrapper" onClick={handleBack}></div>
      <header>
        <img src={iconAvatar} alt="" className="avatar" />
        {typeof dataSource === 'object' && (
          <div className="descItems">
            <div className="descItem">
              <img src={dataSource?.icon} alt="" className="sourceIcon" />
              <div className="value">{dataSource?.name}</div>
            </div>
            <div className="descItem">
              <div className="label">API Key: </div>
              <div className="value">{formatApiKey || 'ApiKey'}</div>
              {/* <img src={iconClock} alt="" className="clockIcon" /> */}
            </div>
            <div className="descItem">
              <div className="label">Date: </div>
              <div className="value">{dataSource?.date}</div>
              {/* <img src={iconClock} alt="" className="clockIcon" /> */}
            </div>
          </div>
        )}
      </header>
      <section className="sourceStatisticsBar">
        <div className="descItem">
          <div className="inner">
            <div className="label">Est Total Value</div>
            <div className="value">${totalAssetsBalance}</div>
            {/* TODO  */}
            <div className="btcValue">≈ {eqBtcNum} BTC</div>
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
                <img className="iconArrow" src={iconArrowRight} alt="" />
              </div>
            </div>
          );
        })}
      </section>
      <TokenTable list={totalAssetsList} />
    </div>
  );
};

export default AssetsDetail;
