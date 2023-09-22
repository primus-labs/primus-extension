import React, { useMemo, useEffect, memo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';

import TokenTable from '@/components/TokenTable';
import iconAvatar from '@/assets/img/iconAvatar.png';
import iconCredCreate from '@/assets/img/iconCredCreate.svg';

import { setExSourcesAsync } from '@/store/actions';
import useUpdateAssetSource from '@/hooks/useUpdateAssetSources';
import DataUpdateBar from '@/components/DataSourceOverview/DataUpdateBar';
import { gte, div, formatNumeral, formatAddress } from '@/utils/utils';
import { BTC } from '@/config/constants';
import { getTokenPrice } from '@/services/api/dataSource';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { ExData, onChainAssetsData } from '@/types/dataSource';

import './index.sass';
import { eventReport } from '@/services/api/usertracker';

const AssetsDetail = memo(() => {
  const [btcPriceFromService, setBtcPriceFromService] = useState<string>();
  const exSources = useSelector((state: UserState) => state.exSources);
  const onChainAssetsSources = useSelector(
    (state: UserState) => state.onChainAssetsSources
  );

  const dispatch: Dispatch<any> = useDispatch();
  const [fetchExDatasLoading, fetchExDatas] = useUpdateAssetSource();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchAddress = searchParams.get('address') as string;
  const searchName = searchParams.get('name') as string;
  const sourceName = searchName.toLowerCase();

  const isOnChainData = useMemo(() => {
    return decodeURIComponent(searchName) === 'On-chain';
  }, [searchName]);
  const dataSource = useMemo(() => {
    if (isOnChainData) {
      return onChainAssetsSources[searchAddress] as onChainAssetsData;
    } else {
      return exSources[sourceName] as ExData;
    }
  }, [
    exSources,
    sourceName,
    isOnChainData,
    onChainAssetsSources,
    searchAddress,
  ]);
  const btcPrice = useMemo(() => {
    if (isOnChainData) {
      return btcPriceFromService;
    } else {
      if (typeof dataSource === 'object') {
        const curDataSource = dataSource as ExData;
        const originP =
          curDataSource?.tokenPriceMap[
            BTC as keyof typeof curDataSource.tokenPriceMap
          ];
        return originP ? originP : null;
      } else {
        return null;
      }
    }
  }, [dataSource, isOnChainData, btcPriceFromService]);
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
      const obj = (dataSource as ExData).flexibleAccountTokenMap;
      return obj;
    } else {
      return undefined;
    }
  }, [dataSource]);
  const spotAccountTokenMap = useMemo(() => {
    if (typeof dataSource === 'object') {
      const obj = (dataSource as ExData).spotAccountTokenMap;
      return obj;
    } else {
      return undefined;
    }
  }, [dataSource]);

  const handleBack = () => {
    navigate(-1);
  };
  const onUpdate = () => {
    // dispatch(setExSourcesAsync());
  };
  const fetchExData = () => {
    !fetchExDatasLoading &&
      (fetchExDatas as (name: string) => void)(sourceName);
  };

  const navToCred = useCallback(() => {
    navigate(`/cred?createFlag=${sourceName}`);
  }, [navigate, sourceName]);
  const fetchBTCPrice = async () => {
    try {
      const { BTC } = await getTokenPrice({
        currency: 'BTC',
        source: 'BINANCE',
      });
      setBtcPriceFromService(BTC);
    } catch {
      //alert('getTokenPrice network error!');
      console.log('getTokenPrice network error!');
    }
  };
  useEffect(() => {
    if (isOnChainData) {
      fetchBTCPrice();
    }
  }, [isOnChainData]);
  const headerRightContent = useMemo(() => {
    return isOnChainData ? (
      <></>
    ) : (
      <button className="tokenTableHeaderRight" onClick={navToCred}>
        <img src={iconCredCreate} alt="" />
        <span>Create Proof</span>
      </button>
    );
  }, [navToCred, isOnChainData]);
  const formatAddr = useMemo(() => {
    const curDataSource = dataSource as onChainAssetsData;
    if (curDataSource?.address) {
      return formatAddress(curDataSource?.address, 4, 4);
    }
    return '';
  }, [dataSource]);

  const detailEventReport = () => {
    const eventInfo = {
      eventType: 'DATA_FETCH',
      rawData: {type: "AssetsDetail", source: sourceName},
    };
    eventReport(eventInfo);
  };
  useEffect(() => {
    if (sourceName) {
      fetchExData();
      detailEventReport();
    }
  }, [sourceName]);

  useEffect(() => {
    !fetchExDatasLoading && onUpdate();
  }, [fetchExDatasLoading]);

  return (
    <div className="assetsDetail">
      <div className="iconBackWrapper" onClick={handleBack}></div>
      <header>
        <img src={iconAvatar} alt="" className="avatar" />
        {typeof dataSource === 'object' && dataSource?.label && <h3>{dataSource?.label}</h3>}
        {typeof dataSource === 'object' && (
          <div className="descItems">
            <div className="descItem">
              <img src={dataSource?.icon} alt="" className="sourceIcon" />
              <div className="value">
                {isOnChainData ? formatAddr : dataSource?.name}
              </div>
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
