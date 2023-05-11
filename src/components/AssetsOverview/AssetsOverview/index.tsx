import React, { useState, useMemo, useCallback, memo } from 'react';
import './index.sass';
import type {
  AssetsMap,
  DataSourceItemType,
} from '@/components/DataSourceOverview/DataSourceItem';
import type { DataSourceItemList } from '@/components/DataSourceOverview/DataSourceList';
import SourcesStatisticsBar from '../SourcesStatisticsBar';
import TokenTable from '@/components/TokenTable';
import BigNumber from 'bignumber.js';
import { add, mul, gte, sub, div,formatNumeral } from '@/utils/utils';
import PieChart from '../PieChart';

interface AssetsOverviewProps {
  filterSource: string | undefined;
  onClearFilter: () => void;
  list: DataSourceItemList;
}

const AssetsOverview: React.FC<AssetsOverviewProps> = memo(({ filterSource,onClearFilter, list }) => {
  console.log('AssetsOverview-list', list)
  const [activeSourceName, setActiveSourceName] = useState<string>();
  const totalAssetsBalance = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: DataSourceItemType) => BigNumber = (
      prev,
      curr
    ) => {
      const { totalBalance } = curr;
      return add(prev.toNumber(), Number(totalBalance));
    };
    const bal = list.reduce(reduceF, new BigNumber(0));
    return `${bal.toFixed(2)}`;
  }, [list]);
  const formatTotalBal = useMemo( () => {
    return totalAssetsBalance ? `$${formatNumeral(totalAssetsBalance)}` : '--'
  }, [totalAssetsBalance])

  const totalPnl = useMemo(() => {
    const reduceF: (prev: BigNumber | null, curr: DataSourceItemType) => BigNumber | null = (
      prev,
      curr
    ) => {
      const { pnl } = curr;
      if (pnl !== null && pnl !== undefined) {
        let formatPrev = prev
        if (prev === null) {
          formatPrev = new BigNumber(0)
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
        ? `+$${formatNumeral(totalPnl.toFixed(), {decimalPlaces:4})}`
        : `-$${formatNumeral(totalPnl.abs().toFixed(), {decimalPlaces:4})}`
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
    const reduceF: (prev: AssetsMap, curr: DataSourceItemType) => AssetsMap = (
      prev,
      curr
    ) => {
      const { tokenListMap } = curr;
      if (tokenListMap) {
        Object.keys(tokenListMap).forEach((symbol) => {
          if (symbol in prev) {
            const { amount: prevAmount, price } = prev[symbol];
            const { amount } = tokenListMap[symbol];
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
                ...tokenListMap[symbol],
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
      const activeS: DataSourceItemType = list.find(
        (item) => item.name === activeSourceName
      ) as DataSourceItemType;
      return activeS.tokenListMap;
    } else {
      return totalAssetsMap;
    }
  }, [list, activeSourceName, totalAssetsMap]);
  const activeSourceTokenList = useMemo(() => {
    return Object.values(activeAssetsMap as AssetsMap);
  }, [activeAssetsMap]);
  const flexibleAccountTokenMap = useMemo(() => {
    if (activeSourceName) {
      const activeS: DataSourceItemType = list.find(
        (item) => item.name === activeSourceName
      ) as DataSourceItemType;
      return activeS.flexibleAccountTokenMap;
    } else {
      return undefined;
    }
  }, [list, activeSourceName]);
  const spotAccountTokenMap = useMemo(() => {
    if (activeSourceName) {
      const activeS: DataSourceItemType = list.find(
        (item) => item.name === activeSourceName
      ) as DataSourceItemType;
      return activeS.spotAccountTokenMap;
    } else {
      return undefined;
    }
  }, [list, activeSourceName]);

  const handleSelectSource = useCallback((sourceName: string | undefined) => {
    setActiveSourceName(sourceName);
  },[]);
  const getChartData = useMemo(() => {
    const chartData = list.map(({ name, totalBalance }) => ({
      name,
      value: new BigNumber(totalBalance as string).toFixed(2),
    }));
    return chartData;
  },[list]);
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
                  <div className={formatTotalPnlPercent.indexOf('+')>-1? 'percent raise': 'percent fall'}>
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
          <header>Distribution</header>
          <div className="cardCon">
            <PieChart list={getChartData} />
          </div>
        </div>
      </section>
      <SourcesStatisticsBar
        list={list}
        onSelect={handleSelectSource}
        filterSource={filterSource}
        onClearFilter={onClearFilter}
      />
      <TokenTable list={activeSourceTokenList} flexibleAccountTokenMap={flexibleAccountTokenMap} spotAccountTokenMap={spotAccountTokenMap} name={activeSourceName?.toLowerCase()}/>
    </div>
  );
});

export default AssetsOverview;
