import React, { useRef, useEffect, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { add, sub, div, mul, gte, formatNumeral } from '@/utils/utils';
import useAllSources from './useAllSources';

const useAssetsStatistic = function () {
  const { sourceMap } = useAllSources();
  const connectedOnChainSourcesList = useMemo(() => {
    return Object.values(sourceMap.onChainAssetsSources);
  }, [sourceMap]);
  const connectedExchangeSourcesList = useMemo(() => {
    return Object.values(sourceMap.exSources);
  }, [sourceMap]);
  const totalExchangeAssetsBalance = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { totalBalance } = curr;
      return add(prev.toNumber(), Number(totalBalance));
    };
    const bal = connectedExchangeSourcesList.reduce(reduceF, new BigNumber(0));
    return `${bal.toFixed(2)}`;
  }, [connectedExchangeSourcesList]);
  const totalOnChainAssetsBalance = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { totalBalance } = curr;
      return add(prev.toNumber(), Number(totalBalance));
    };
    const bal = connectedOnChainSourcesList.reduce(reduceF, new BigNumber(0));
    return `${bal.toFixed(2)}`;
  }, [connectedOnChainSourcesList]);
  const totalAssetsBalance = useMemo(() => {
    const bal = add(
      Number(totalExchangeAssetsBalance),
      Number(totalOnChainAssetsBalance)
    );
    return `${bal.toFixed(2)}`;
  }, [totalExchangeAssetsBalance, totalOnChainAssetsBalance]);
  const formatTotalAssetsBalance = useMemo(() => {
    return totalAssetsBalance
      ? `$${formatNumeral(totalAssetsBalance)}`
      : '--';
  }, [totalAssetsBalance]);
  const totalPnl = useMemo(() => {
    const reduceF: (prev: BigNumber | null, curr: any) => BigNumber | null = (
      prev,
      curr
    ) => {
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
    const list = [
      ...connectedOnChainSourcesList,
      ...connectedExchangeSourcesList,
    ];
    const bal = list.reduce(reduceF, null);

    return `${(bal ?? 0).toFixed(2)}`;
  }, [connectedOnChainSourcesList, connectedExchangeSourcesList]);
  const totalPnlPercent = useMemo(() => {
    if (totalPnl !== null && totalPnl !== undefined && totalAssetsBalance) {
      const currVN = Number(totalAssetsBalance);
      const lastV = sub(currVN, Number(totalPnl));
      const lastVN = lastV.toNumber();
      const p = div(sub(currVN, lastVN).toNumber(), lastVN);
      return p.toFixed(2);
    } else {
      return '';
    }
  }, [totalPnl, totalAssetsBalance]);

  const formatTotalPnlPercent = useMemo(() => {
    if (totalPnlPercent) {
      const formatNum = mul(Number(totalPnlPercent), 100);
      const formatTxt = gte(Number(formatNum), 0)
        ? `+${new BigNumber(Number(formatNum)).toFixed(2)}%`
        : `-${new BigNumber(Number(formatNum)).abs().toFixed(2)}%`;
      return formatTxt;
    } else {
      return '-';
    }
  }, [totalPnlPercent]);
  return {
    totalExchangeAssetsBalance,
    totalOnChainAssetsBalance,
    totalAssetsBalance,
    formatTotalAssetsBalance,
    totalPnl,
    totalPnlPercent,
    formatTotalPnlPercent,
  };
};
export default useAssetsStatistic;
