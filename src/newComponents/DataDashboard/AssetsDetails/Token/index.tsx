import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BigNumber from 'bignumber.js';
import {
  setExSourcesAsync,
  setOnChainAssetsSourcesAsync,
} from '@/store/actions';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import useMsgs from '@/hooks/useMsgs';
import {
  sub,
  add,
  div,
  mul,
  formatNumeral,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
} from '@/utils/utils';
import { WALLETMAP } from '@/config/wallet';
import { DATASOURCEMAP } from '@/config/dataSource2';

import useAllSources from '@/hooks/useAllSources';
import PButton from '@/newComponents/PButton';
import PStar from '@/newComponents/PStar';

import './index.scss';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PArrow from '@/newComponents/PArrow';
import TokenTable from '../TokenTable';
const MAX = 5;

const Token = memo(() => {
  const {
    totalOnChainAssetsBalance,
    totalAssetsBalance,
    formatTotalAssetsBalance,
    totalPnl,
    totalPnlPercent,
    formatTotalPnlPercent,
  } = useAssetsStatistic();
  const dispatch = useDispatch();
  const { sourceMap, sourceMap2 } = useAllSources();
  const [current, setCurrent] = useState(1);
  const [starArr, setStarArr] = useState<string[]>();

  const [showMore, setShowMore] = useState<boolean>(false);
  const [activeExpand, setActiveExpand] = useState<string[]>([]);

  const sysConfig = useSelector((state) => state.sysConfig);

  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);

  const connectedExchangeSources = useMemo(() => {
    return sourceMap.exSources;
  }, [sourceMap]);
  const connectedOnChainSources = useMemo(() => {
    return sourceMap.onChainAssetsSources;
  }, [sourceMap]);
  console.log('22connectedSocialSources', sourceMap); // delete
  const connectedAssetsSourcesList = useMemo(() => {
    let l = Object.values(connectedExchangeSources);
    if (Object.keys(connectedOnChainSources).length > 0) {
      const newOnChainList = Object.values(connectedOnChainSources).map(
        (i: any) => {
          const { name, icon } = WALLETMAP['metamask'];
          return Object.assign(i, { name, icon, id: i.address });
        }
      );
      l = l.concat(newOnChainList);
    }

    return l;
  }, [connectedExchangeSources, connectedOnChainSources]);
  const queryIconFn = (id) => {
    if (id.startsWith('0x')) {
      return WALLETMAP['metamask'].icon;
    } else {
      return DATASOURCEMAP[id].icon;
    }
  };
  const queryNameFn = (id) => {
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
                icon: queryIconFn(id),
                symbol: queryNameFn(id),
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
                    icon: queryIconFn(id),
                    symbol: queryNameFn(id),
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
    let noStarL = l.filter((i: any) => !starArr?.includes(i.symbol));
    let hasStarL = l.filter((i: any) => starArr?.includes(i.symbol));

    noStarL = sortFn(noStarL);
    hasStarL = sortFn(hasStarL);
    return [...hasStarL, ...noStarL];
  }, [totalAssetsMap, starArr]);

  const showList = useMemo(() => {
    return showMore
      ? sortedHoldingTokensList
      : sortedHoldingTokensList.slice(0, MAX);
  }, [sortedHoldingTokensList, showMore]);

  const handleShowMore = useCallback(() => {
    setShowMore((f) => !f);
  }, []);

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
        return mul(Number(digit), 100).toFixed(2);;
      }
    },
    [totalAssetsBalance]
  );

  const holdingTokenLogosFn = useCallback((i) => {
    const l = Object.values(i.portfolio).map((i: any) => i.icon);
    return l;
  }, []);

  const handleExpand = useCallback(
    (dataSource) => {
      const { symbol } = dataSource;
      if (activeExpand.includes(symbol)) {
        setActiveExpand((arr) => {
          const newArr = [...arr];
          const idx = newArr.findIndex((i) => i === symbol);
          newArr.splice(idx, 1);
          return newArr;
        });
      } else {
        setActiveExpand((arr) => {
          const newArr = [...arr, symbol];
          return newArr;
        });
      }
    },
    [activeExpand]
  );
  const resetStarArr = async () => {
    const { assetsStarsMap: assetsStarsMapStr } =
      await chrome.storage.local.get(['assetsStarsMap']);
    if (assetsStarsMapStr) {
      const assetsStarsMapObj = JSON.parse(assetsStarsMapStr);
      if (assetsStarsMapObj.token) {
        setStarArr(Object.keys(assetsStarsMapObj.token));
      }
    }
  };
  const handleStar = useCallback(async (i) => {
    const { symbol } = i;
    const { assetsStarsMap: assetsStarsMapStr } =
      await chrome.storage.local.get(['assetsStarsMap']);
    if (assetsStarsMapStr) {
      const assetsStarsMapObj = JSON.parse(assetsStarsMapStr);
      if (assetsStarsMapObj.token) {
        if (symbol in assetsStarsMapObj.token) {
          delete assetsStarsMapObj.token[symbol];
        } else {
          assetsStarsMapObj.token[symbol] = 1;
        }
        await chrome.storage.local.set({
          assetsStarsMap: JSON.stringify(assetsStarsMapObj),
        });
      }
    } else {
      const obj = {
        token: { [symbol]: 1 },
        chain: {},
      };
      await chrome.storage.local.set({
        assetsStarsMap: JSON.stringify(obj),
      });
    }
    resetStarArr();
  }, []);
  const iconFn = useCallback(
    (j) => {
      if (j.icon) {
        return j.icon;
      } else if (j.logo) {
        return j.logo;
      } else {
        const symbol = j.symbol.split('---')[0];
        return `${tokenLogoPrefix}icon${symbol}.png`;
      }
    },
    [tokenLogoPrefix]
  );
  useEffect(() => {
    resetStarArr();
  }, []);
  return (
    <section className="tableSection token">
      <ul className="dataSourceItems">
        {showList.map((i: any) => {
          return (
            <li className="dataSourceItem" key={i.id}>
              <div className="mainInfo">
                <div className="left">
                  <PStar
                    open={starArr?.includes(i.symbol)}
                    onClick={() => {
                      handleStar(i);
                    }}
                  />
                  <img src={iconFn(i)} alt="" className="sourceIcon" />
                  <div className="breif">
                    <div className="top">
                      <div className="name">{i.symbol.split('---')[0]}</div>
                    </div>
                    <div className="bottom">
                      <div className="balance">${formatNumeral(i.value)}</div>
                      <div className="percent">({balancePercentFn(i)}%)</div>
                    </div>
                  </div>
                </div>
                <div className="right">
                  <div className="amount">
                    <div className="label">Amount</div>
                    <div className="value">
                      {formatNumeral(i.amount, { decimalPlaces: 6 })}
                    </div>
                  </div>
                  <div className="price">
                    <div className="label">Price</div>
                    <div className="value">
                      ${formatNumeral(i.price, { decimalPlaces: 2 })}
                    </div>
                  </div>
                  <div className="tokensWrapper">
                    <div className="tokens">
                      <div className="label">Portfolio</div>
                      <SplicedIcons list={holdingTokenLogosFn(i)} max={3} />
                    </div>
                    <PArrow
                      onClick={() => {
                        handleExpand(i);
                      }}
                    />
                  </div>
                </div>
              </div>
              {activeExpand.includes(i.symbol) && (
                <>
                  <div className="extraInfo">
                    <div className="card">
                      <i className="iconfont icon-iconAmountForAttest"></i>
                      <div className="txtWrapper">
                        <div className="label">Tokens</div>
                        <div className="value">${formatNumeral(i.value)}</div>
                      </div>
                    </div>
                  </div>
                  <TokenTable
                    title="Portfolio"
                    id={i.id}
                    listMap={i.portfolio}
                  />
                </>
              )}
            </li>
          );
        })}
      </ul>
      {sortedHoldingTokensList.length > MAX && (
        <PButton
          type="text"
          text="View More"
          suffix={
            <i
              className={`iconfont icon-DownArrow ${showMore && 'rotate'}`}
            ></i>
          }
          onClick={handleShowMore}
          className="moreBtn"
        />
      )}
    </section>
  );
});

export default Token;
