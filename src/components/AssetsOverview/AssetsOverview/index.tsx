import React, { useState, useMemo, useCallback, memo } from 'react';
import BigNumber from 'bignumber.js';

import SourcesStatisticsBar from '../SourcesStatisticsBar';
import TokenTable from '@/components/TokenTable';
import PieChart from '../PieChart';
import PieTabs from './PieTabs';
import ChartOptionsDetailDialog from './ChartOptionsDetailDialog';
import {
  add,
  mul,
  gte,
  gt,
  sub,
  div,
  formatNumeral,
  formatAddress,
} from '@/utils/utils';

import type {
  AssetsMap,
  DataSourceItemType,
} from '@/components/DataSourceOverview/DataSourceList/DataSourceItem';
import type {
  ExDataList,
  ExData,
  AssetDataList,
  onChainAssetsData,
} from '@/types/dataSource';
import './index.sass';

interface AssetsOverviewProps {
  filterSource: string | undefined;
  onClearFilter: () => void;
  list: AssetDataList;
}

const AssetsOverview: React.FC<AssetsOverviewProps> = memo(
  ({ filterSource, onClearFilter, list }) => {
    //console.log('AssetsOverview-list', list);
    const [chartOptionsDetailVisible, setChartOptionsDetailVisible] =
      useState(false);
    const [activeSourceName, setActiveSourceName] = useState<string>();
    const [pieTab, setPieTab] = useState<string>('Source');
    const totalAssetsBalance = useMemo(() => {
      const reduceF: (prev: BigNumber, curr: ExData) => BigNumber = (
        prev,
        curr
      ) => {
        const { totalBalance } = curr;
        return add(prev.toNumber(), Number(totalBalance));
      };
      const bal = list.reduce(reduceF, new BigNumber(0));
      return `${bal.toFixed(2)}`;
    }, [list]);
    const formatTotalBal = useMemo(() => {
      return totalAssetsBalance
        ? `$${formatNumeral(totalAssetsBalance)}`
        : '--';
    }, [totalAssetsBalance]);
    const totalPnl = useMemo(() => {
      const reduceF: (
        prev: BigNumber | null,
        curr: DataSourceItemType
      ) => BigNumber | null = (prev, curr) => {
        const { pnl } = curr;
        if (pnl !== null && pnl !== undefined) {
          let formatPrev = prev;
          if (prev === null) {
            formatPrev = new BigNumber(0);
          }
          return add((formatPrev as BigNumber).toNumber(), Number(pnl));
        }
        return prev;
      };
      const bal = list.reduce(reduceF, null);
      return bal;
    }, [list]);
    const formatTotalPnl = useMemo(() => {
      return totalPnl
        ? gte(Number(totalPnl), 0)
          ? `+$${formatNumeral(totalPnl.toFixed(), { decimalPlaces: 4 })}`
          : `-$${formatNumeral(totalPnl.abs().toFixed(), { decimalPlaces: 4 })}`
        : '--';
    }, [totalPnl]);
    const formatTotalPnlPercent = useMemo(() => {
      if (totalPnl !== null && totalPnl !== undefined && totalAssetsBalance) {
        const currVN = Number(totalAssetsBalance);
        const lastV = sub(currVN, Number(totalPnl));
        const lastVN = lastV.toNumber();
        const p = div(sub(currVN, lastVN).toNumber(), lastVN);
        const formatNum = mul(p.toNumber(), 100);
        const formatTxt = gte(Number(formatNum), 0)
          ? `+${new BigNumber(Number(formatNum)).toFixed(2)}%`
          : `-${new BigNumber(Number(formatNum)).abs().toFixed(2)}%`;
        return formatTxt;
      } else {
        return '';
      }
    }, [totalPnl, totalAssetsBalance]);
    const totalAssetsMap: AssetsMap = useMemo(() => {
     
      const reduceF: (
        prev: AssetsMap,
        curr: DataSourceItemType
      ) => AssetsMap = (prev, curr) => {
        const { tokenListMap } = curr;
        if (tokenListMap) {
          Object.keys(tokenListMap).forEach((tokenListMapSymbol) => {
            // const { symbol, amount } = tokenListMap[tokenListMapSymbol];
            const symbol = tokenListMapSymbol.split('---')[0];
            if (symbol in prev) {
              const { amount: prevAmount, price } = prev[symbol];
              const { amount } = tokenListMap[tokenListMapSymbol];
              const totalAmount = add(
                Number(prevAmount),
                Number(amount)
              ).toFixed();
              const totalValue = mul(
                Number(totalAmount),
                Number(price)
              ).toFixed();
              prev[symbol] = {
                symbol,
                price,
                amount: totalAmount,
                value: totalValue,
              };
            } else {
              prev = {
                ...prev,
                [symbol]: {
                  ...tokenListMap[tokenListMapSymbol],
                },
              };
            }
          });
        }
        return prev;
      };
      const totalTokenMap = list.reduce(reduceF, {});
      return totalTokenMap;
    }, [list]);
    const totalAssetsNo = useMemo(() => {
      return Object.keys(totalAssetsMap).length;
    }, [totalAssetsMap]);

    const activeAssetsMap = useMemo(() => {
      if (activeSourceName) {
        // TODO
        // const activeS: DataSourceItemType = list.find(
        //   (item) => item.name === activeSourceName
        // ) as DataSourceItemType;

        const activeS: DataSourceItemType = list.find((item) => {
          if (item.name === 'On-chain') {
            const formatAddr = formatAddress(item.address as string, 4, 4);
            return formatAddr === activeSourceName;
          }
          return item.name === activeSourceName;
        }) as any;
        return activeS.tokenListMap;
      } else {
        return totalAssetsMap;
      }
    }, [list, activeSourceName, totalAssetsMap]);
    const activeSourceTokenList = useMemo(() => {
      return Object.values(activeAssetsMap as AssetsMap);
    }, [activeAssetsMap]);
    const flexibleAccountTokenMap = useMemo(() => {
      if (activeSourceName && !activeSourceName.includes('...')) {
        const activeS: DataSourceItemType = list.find(
          (item) => item.name === activeSourceName
        ) as DataSourceItemType;
        return activeS.flexibleAccountTokenMap;
      } else {
        return undefined;
      }
    }, [list, activeSourceName]);
    const spotAccountTokenMap = useMemo(() => {
      if (activeSourceName && !activeSourceName.includes('...')) {
        const activeS: DataSourceItemType = list.find(
          (item) => item.name === activeSourceName
        ) as DataSourceItemType;
        return activeS.spotAccountTokenMap;
      } else {
        return undefined;
      }
    }, [list, activeSourceName]);
    const getChartData = useMemo(() => {
      
      if (pieTab === 'Token') {
        let formatArr: any = [];
        // let othersTotalBalance: any = new BigNumber(0);
        Object.values(totalAssetsMap as AssetsMap).forEach(
          ({ symbol, value, address }) => {
            let formatSymbol = symbol;
            let formatValue = Number(value).toFixed(2);
            if (address) {
              const symbolAAddrArr = symbol.split('---');
              // const formatAddr = formatAddress(address, 0, 4, '**');
              // formatSymbol = `${symbolAAddrArr[0]}(${formatAddr})`;
              formatSymbol = `${symbolAAddrArr[0]}`;
            }
            formatArr.push({
              name: formatSymbol,
              value: formatValue,
            });
          }
        );
        
        return formatArr;
      } else {
        const chartData = list.map(({ name, totalBalance, address }) => {
          let formatName = name;
          if (name === 'On-chain') {
            const formatAddr = formatAddress(address, 4, 4);
            formatName = formatAddr;
          }
          return {
            name: formatName,
            // name,
            value: new BigNumber(totalBalance as string).toFixed(2),
          };
        });
        return chartData;
      }
      // totalAssetsMap
    }, [list, pieTab, totalAssetsMap]);
    const getShowChartData = useMemo(() => {
      const len = getChartData.length;
      if (len > 6) {
        const orderedList = getChartData.sort((a:any, b:any) =>
            sub(Number(b.value), Number(a.value)).toNumber())
          
        // console.log('getChartData', getChartData, getChartData.slice(0, 6));
        return orderedList.slice(0, 6);
      }
      return getChartData;
    }, [getChartData]);
    const handleShowChartOptionsDetail = useCallback(() => {
      setChartOptionsDetailVisible(true);
    }, []);
    const getShowChartOthers = useMemo(() => {
      const len = getChartData.length;
      if (len > 6) {
        return (
          <div
            className="chartOthersWrapper"
            onClick={handleShowChartOptionsDetail}
          >
            <i></i>
            <div className="label">Others</div>
            <div className="value">View All</div>
          </div>
        );
      } else {
        return null;
      }
    }, [getChartData, handleShowChartOptionsDetail]);
    const lowerCaseSourceName = useMemo(() => {
      return activeSourceName?.toLowerCase();
    }, [activeSourceName]);

    const handleSelectSource = useCallback((sourceName: string | undefined) => {
      // TODO address
      setActiveSourceName(sourceName);
    }, []);
    const activeAllChainMap = useMemo(() => {
      if (activeSourceName?.includes('...')) {
        const activeS: onChainAssetsData = list.find((item) => {
          if (item.name === 'On-chain') {
            const formatAddr = formatAddress(item.address as string, 4, 4);
            return formatAddr === activeSourceName;
          }
          return item.name === activeSourceName;
        }) as onChainAssetsData;
        return activeS?.chainsAssetsMap;
      }
      return {};
    }, [activeSourceName, list]);
    const onChangePieTab = useCallback((tab: string) => {
      setPieTab(tab);
    }, []);

    return (
      <div className="assetsOverview">
        <section className="statisticsWrapper">
          <div className="card cardL">
            <header>Overview</header>
            <div className="cardCon">
              <div className="descItem mainDescItem">
                <div className="label">Total Balance</div>
                <div className="value">{formatTotalBal}</div>
              </div>
              <div className="descItemsWrapper">
                <div className="descItem">
                  <div className="label">PnL</div>
                  <div className="value">
                    <span>{formatTotalPnl}</span>
                    <div
                      className={
                        formatTotalPnlPercent.indexOf('+') > -1
                          ? 'percent raise'
                          : 'percent fall'
                      }
                    >
                      {formatTotalPnlPercent}
                    </div>
                  </div>
                </div>
                <div className="descItem">
                  <div className="label">Assets No.</div>
                  <div className="value">{totalAssetsNo}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card cardR">
            <header>
              <span>Distribution</span>
              <PieTabs onChange={onChangePieTab} value="Source" />
            </header>
            <div className="cardCon pieChartFatherBox">
              <PieChart list={getShowChartData} others={getShowChartOthers} />
            </div>
            {getShowChartOthers}
          </div>
        </section>
        {chartOptionsDetailVisible && <ChartOptionsDetailDialog type={pieTab}  list={getChartData} onClose={ () => {setChartOptionsDetailVisible(false)}} />}
        <SourcesStatisticsBar
          list={list}
          onSelect={handleSelectSource}
          filterSource={filterSource}
          onClearFilter={onClearFilter}
        />
        <TokenTable
          list={activeSourceTokenList}
          flexibleAccountTokenMap={flexibleAccountTokenMap}
          spotAccountTokenMap={spotAccountTokenMap}
          name={lowerCaseSourceName}
          allChainMap={activeAllChainMap}
          showFilter={activeSourceName?.includes('...')}
        />
      </div>
    );
  }
);

export default AssetsOverview;
