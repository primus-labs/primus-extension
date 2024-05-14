import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import { sub, formatNumeral } from '@/utils/utils';
import PButton from '@/newComponents/PButton';
import PStar from '@/newComponents/PStar';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PArrow from '@/newComponents/PArrow';
import TokenTable from '../TokenTable';
import './index.scss';

const MAX = 5;

const Token = memo(() => {
  const { sortedHoldingTokensList, balancePercentFn, tokenIconFn } =
    useAssetsStatistic();
  const [starArr, setStarArr] = useState<string[]>();
  const [pageSize, setPageSize] = useState<number>(1);
  const [activeExpand, setActiveExpand] = useState<string[]>([]);

  const sortedHoldingTokensList2 = useMemo(() => {
    const l = sortedHoldingTokensList;
    let noStarL = l.filter((i: any) => !starArr?.includes(i.symbol));
    let hasStarL = l.filter((i: any) => starArr?.includes(i.symbol));
    return [...hasStarL, ...noStarL];
  }, [sortedHoldingTokensList, starArr]);

  const totalPageSize = useMemo(() => {
    return Math.ceil(sortedHoldingTokensList2.length / MAX);
  }, [sortedHoldingTokensList2]);
  const showList = useMemo(() => {
    const showLen = MAX * pageSize;
    return sortedHoldingTokensList2.slice(0, showLen);
  }, [sortedHoldingTokensList2, pageSize]);

  const handleShowMore = useCallback(() => {
    setPageSize((p) => {
      if (p < totalPageSize) {
        p += 1;
      } else {
        p = 1;
      }
      return p;
    });
  }, [totalPageSize]);

  const sortListMapFn = useCallback((i) => {
    const l = Object.values(i);
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.value), Number(a.value)).toNumber()
      );
    };
    const sortedL = sortFn(l);
    return sortedL;
  }, []);
  const holdingTokenLogosFn = useCallback(
    (i) => {
      const l = sortListMapFn(i.portfolio).map((i: any) => i.icon);
      return l;
    },
    [sortListMapFn]
  );

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
                  <img src={tokenIconFn(i)} alt="" className="sourceIcon" />
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
                    <PArrow
                      onClick={() => {
                        handleExpand(i);
                      }}
                    />
                    {!activeExpand.includes(i.symbol) && (
                      <div className="tokens">
                        <div className="label">Portfolio</div>
                        <SplicedIcons
                          list={holdingTokenLogosFn(i)}
                          max={3}
                          plusSign={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {activeExpand.includes(i.symbol) && (
                <TokenTable
                  title="Portfolio"
                  id={i.id}
                  listMap={sortListMapFn(i.portfolio)}
                />
              )}
            </li>
          );
        })}
      </ul>
      {sortedHoldingTokensList2.length > MAX && (
        <PButton
          type="text"
          text={pageSize === totalPageSize ? 'Collapse' : 'View More'}
          suffix={
            <i
              className={`iconfont icon-DownArrow ${
                pageSize === totalPageSize && 'rotate'
              }`}
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
