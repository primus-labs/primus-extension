import React, { useMemo, useEffect, memo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import ConnectWalletData from '@/components/DataSourceOverview/ConnectWalletData';
import SourcesStatisticsBar from '@/components/AssetsOverview/SourcesStatisticsBar';
import TokenTable from '@/components/TokenTable';
import iconAvatar from '@/assets/img/iconAvatar.png';
import iconCredCreate from '@/assets/img/iconCredCreate.svg';

import useUpdateOnChainSources from '@/hooks/useUpdateOnChainSources';
import DataUpdateBar from '@/components/DataSourceOverview/DataUpdateBar';
import {
  gte,
  div,
  sub,
  formatNumeral,
  formatAddress,
  getCurrentDate,
  getStatisticalData,
} from '@/utils/utils';
import {
  BTC,
  DATASOURCEMAP,
  SUPPORRTEDQUERYCHAINMAP,
} from '@/config/constants';
import { getTokenPrice, getAssetsOnChains } from '@/services/api/dataSource';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type {
  ExData,
  onChainAssetsData,
  ChainAssetsMap,
  ChainsAssetsMap,
  SourceDataList,
} from '@/types/dataSource';

import './index.sass';
import { eventReport } from '@/services/api/usertracker';

const AssetsDetail = memo(() => {
  const [activeSourceName, setActiveSourceName] = useState<string>();
  const [connectWalletDataDialogVisible, setConnectWalletDataDialogVisible] =
    useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [btcPriceFromService, setBtcPriceFromService] = useState<string>();
  const exSources = useSelector((state: UserState) => state.exSources);
  const onChainAssetsSources = useSelector(
    (state: UserState) => state.onChainAssetsSources
  );

  const [fetchOnChainDatasLoading, fetchOnChainDatas] =
    useUpdateOnChainSources();
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

  const activeAssetsMap = useMemo(() => {
    if (activeSourceName) {
      const activeS: ChainAssetsMap = (dataSource as onChainAssetsData)
        .chainsAssetsMap[activeSourceName];
      return activeS?.tokenListMap;
    } else {
      if (typeof dataSource === 'object') { 
        return dataSource?.tokenListMap;
      } else {
        return {}
      }
      
    }
  }, [dataSource, activeSourceName]);
  const activeSourceTokenList = useMemo(() => {
    return Object.values(activeAssetsMap);
  }, [activeAssetsMap]);

  const allChainMap: ChainsAssetsMap = useMemo(() => {
    if (typeof dataSource === 'object') {
      const list = (dataSource as onChainAssetsData).chainsAssetsMap;
      return list;
    } else {
      return {};
    }
  }, [dataSource]);

  const handleBack = () => {
    navigate(-1);
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
      alert('getTokenPrice network error!');
    }
  };

  const headerRightContent = useMemo(() => {
    return isOnChainData ? (
      <></>
    ) : (
      <button className="tokenTableHeaderRight" onClick={navToCred}>
        <img src={iconCredCreate} alt="" />
        <span>Create Credential</span>
      </button>
    );
  }, [navToCred, isOnChainData]);
  const formatAddr = useMemo(() => {
    if ((dataSource as onChainAssetsData)?.address) {
      return formatAddress((dataSource as onChainAssetsData)?.address, 4, 4);
    }
    return '';
  }, [dataSource]);
  const allChainList = useMemo(() => {
    if (Object.keys(allChainMap).length > 0) {
      const chainInfoArr = Object.keys(allChainMap).map((chainName) => {
        return {
          ...SUPPORRTEDQUERYCHAINMAP[
            chainName as keyof typeof SUPPORRTEDQUERYCHAINMAP
          ],
          ...allChainMap[chainName as keyof typeof allChainMap],
        };
      });
      return chainInfoArr;
    }
    return [];
  }, [allChainMap]);
  
  const handleSelectSource = useCallback((sourceName: string | undefined) => {
    setActiveSourceName(sourceName);
  }, []);

  useEffect(() => {
    if (searchAddress) {
      (fetchOnChainDatas as (name?:string) => void)(searchAddress);
      const eventInfo = {
        eventType: 'DATA_FETCH',
        rawData: {type: "AssetsOnChainDetail", source: sourceName},
      };
      eventReport(eventInfo);
    }
  }, [searchAddress, fetchOnChainDatas]);

  useEffect(() => {
    if (isOnChainData) {
      fetchBTCPrice();
    }
  }, [isOnChainData]);
  useEffect(() => {
    !fetchOnChainDatasLoading && setUpdating(false);
  }, [fetchOnChainDatasLoading]);

  return (
    <div className="assetsDetail onChainAssetsDetail">
      <div className="content">
        <div className="iconBackWrapper" onClick={handleBack}></div>
        <header>
          <img src={iconAvatar} alt="" className="avatar" />
          {typeof dataSource === 'object' && <h3>{dataSource?.label}</h3>}
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
        <SourcesStatisticsBar
          list={allChainList as any}
          onSelect={handleSelectSource}
          onClearFilter={() => {}}
          filterSource={undefined}
        />
        <TokenTable
          list={activeSourceTokenList}
          allChainMap={allChainMap}
          name={sourceName}
          showFilter={false}
          headerRightContent={headerRightContent}
        />
      </div>
      <DataUpdateBar
        type="Assets"
        onUpdate={() => {}}
        sourceName={searchAddress}
      />
      {/* <ConnectWalletData
        visible={connectWalletDataDialogVisible}
        onClose={() => {
          setConnectWalletDataDialogVisible(false);
          setUpdating(false);
        }}
        onCancel={() => {
          setConnectWalletDataDialogVisible(false);
          setUpdating(false);
        }}
        onSubmit={() => {
          setConnectWalletDataDialogVisible(false);
          setUpdating(false);
        }}
      /> */}
    </div>
  );
});

export default AssetsDetail;
