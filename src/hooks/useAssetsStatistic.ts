import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import useAllSources from './useAllSources';
import { gt, add, sub, div, mul, gte, formatNumeral } from '@/utils/utils';
import { WALLETMAP } from '@/config/wallet';
import { DATASOURCEMAP } from '@/config/dataSource2';
import { SUPPORRTEDQUERYCHAINMAP } from '@/config/chain';
import iconOthers from '@/assets/newImg/home/iconOthers.svg';
const useAssetsStatistic = function () {
  const { sourceMap } = useAllSources();
  const sysConfig = useSelector((state) => state.sysConfig);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
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
  const hasTokenAssets = useMemo(() => {
    return gt(Number(totalAssetsBalance), 0);
  }, [totalAssetsBalance]);
  const hasChainAssets = useMemo(() => {
    return gt(Number(totalOnChainAssetsBalance), 0);
  }, [totalOnChainAssetsBalance]);
  const formatTotalAssetsBalance = useMemo(() => {
    return totalAssetsBalance ? `$${formatNumeral(totalAssetsBalance)}` : '--';
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

  const connectedAssetsSourcesList = useMemo(() => {
    let l = connectedExchangeSourcesList;
    if (connectedOnChainSourcesList.length > 0) {
      const newOnChainList = connectedOnChainSourcesList.map((i: any) => {
        const { name, icon } = WALLETMAP['metamask'];
        return Object.assign(i, { name, icon, id: i.address });
      });
      l = l.concat(newOnChainList);
    }
    return l;
  }, [connectedExchangeSourcesList, connectedOnChainSourcesList]);

  const dataSourceIconFn = (id) => {
    if (id.startsWith('0x')) {
      return WALLETMAP['metamask'].icon;
    } else {
      return DATASOURCEMAP[id].icon;
    }
  };
  const dataSourceNameFn = (id) => {
    if (id.startsWith('0x')) {
      return WALLETMAP['metamask'].name;
    } else {
      return DATASOURCEMAP[id].name;
    }
  };
  const totalAssetsMap = useMemo(() => {
    const reduceF = (prev, curr) => {
      const { tokenListMap, id } = curr;
      if (tokenListMap && Object.keys(tokenListMap).length > 0) {
        Object.keys(tokenListMap).forEach((tokenListMapSymbol) => {
          // const { symbol, amount } = tokenListMap[tokenListMapSymbol];
          const symbol = tokenListMapSymbol.split('---')[0];
          if (symbol in prev) {
            const {
              amount: prevAmount,
              price,
              portfolio,
              value,
            } = prev[symbol];
            const { amount } = tokenListMap[tokenListMapSymbol];
            if (!(id in portfolio)) {
              // from.push(id);
              portfolio[id] = {
                icon: dataSourceIconFn(id),
                symbol: dataSourceNameFn(id),
                amount,
                price,
                value,
              };
            }
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
              portfolio,
            };
          } else {
            const currObj = tokenListMap[tokenListMapSymbol];
            const { amount, price, value } = currObj;
            prev = {
              ...prev,
              [symbol]: {
                ...currObj,
                portfolio: {
                  [id]: {
                    icon: dataSourceIconFn(id),
                    symbol: dataSourceNameFn(id),
                    amount,
                    price,
                    value,
                  },
                },
              },
            };
          }
        });
      }
      return prev;
    };
    const totalTokenMap = connectedAssetsSourcesList.reduce(reduceF, {});
    return totalTokenMap;
  }, [connectedAssetsSourcesList]);
  const sortedHoldingTokensList = useMemo(() => {
    const l = Object.values(totalAssetsMap as any);
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.value), Number(a.value)).toNumber()
      );
    };
    return sortFn(l);
  }, [totalAssetsMap]);
  const balancePercentFn = useCallback(
    (i) => {
      const { value: totalBalance } = i;

      if (totalBalance === '0') {
        return '0';
      } else {
        const digit = div(
          Number(totalBalance),
          new BigNumber(totalAssetsBalance).toNumber()
        );
        return mul(Number(digit), 100).toFixed(2);
      }
    },
    [totalAssetsBalance]
  );
  const tokenIconFn = useCallback(
    (j) => {
      if (j.icon) {
        return j.icon;
      } else if (j.logo) {
        return j.logo;
      } else {
        if (j.symbol === 'Others') {
          return iconOthers;
        }
        const symbol = j.symbol.split('---')[0];
        return `${tokenLogoPrefix}icon${symbol}.png`;
      }
    },
    [tokenLogoPrefix]
  );

  const totalChainAssetsMap = useMemo(() => {
    const reduceF = (prev, curr) => {
      const { chainsAssetsMap } = curr;
      if (chainsAssetsMap && Object.keys(chainsAssetsMap).length > 0) {
        Object.keys(chainsAssetsMap).forEach((chain) => {
          const currObj = chainsAssetsMap[chain];
          if (chain in prev) {
            const { totalBalance, tokenListMap } = currObj;
            const {
              totalBalance: prevTotalBalance,
              tokenListMap: prevTokenListMap,
            } = prev[chain];
            const innerReduceF = (prevM, currM) => {
              const symbol = currM.split('---')[0];
              const currTokenItem = tokenListMap[prevM];
              const { amount, price, value, isNative, chain } = currTokenItem;
              if (symbol in prevM) {
                const { amount: prevAmount, chain } = prevM[symbol];
                const totalAmount = add(
                  Number(prevAmount),
                  Number(amount)
                ).toFixed();
                const totalValue = mul(
                  Number(totalAmount),
                  Number(price)
                ).toFixed();
                prevM[symbol] = {
                  amount: totalAmount,
                  price,
                  value: totalValue,
                  isNative,
                  chain,
                };
              } else {
                prevM[symbol] = currTokenItem;
              }
            };

            const newTokenListMap = Object.keys(tokenListMap).reduce(
              innerReduceF,
              prevTokenListMap
            );
            prev[chain] = {
              ...prev[chain],
              totalBalance: add(
                Number(prevTotalBalance),
                Number(totalBalance)
              ).toFixed(),
              tokenListMap: newTokenListMap,
            };
          } else {
            const { icon, name } = SUPPORRTEDQUERYCHAINMAP[chain];
            prev = {
              ...prev,
              [chain]: {
                ...currObj,
                id: chain,
                icon,
                name,
              },
            };
          }
        });
      }
      return prev;
    };
    const tAM = connectedOnChainSourcesList.reduce(reduceF, {});
    return tAM;
  }, [connectedOnChainSourcesList]);

  const sortedChainAssetsList = useMemo(() => {
    const l = Object.values(totalChainAssetsMap as any);
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
      );
    };
    return sortFn(l);
  }, [totalChainAssetsMap]);

  return {
    totalExchangeAssetsBalance,
    totalOnChainAssetsBalance,
    totalAssetsBalance,
    formatTotalAssetsBalance,
    totalPnl,
    totalPnlPercent,
    formatTotalPnlPercent,
    sortedHoldingTokensList,
    balancePercentFn,
    tokenIconFn,
    sortedChainAssetsList,
    hasTokenAssets,
    hasChainAssets,
  };
};
export default useAssetsStatistic;
