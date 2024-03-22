import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import { sub, add, div, mul, formatNumeral } from '@/utils/utils';
import { SUPPORRTEDQUERYCHAINMAP } from '@/config/chain';

import useAllSources from '@/hooks/useAllSources';
import useNFTs from '@/hooks/useNFTs';
import PButton from '@/newComponents/PButton';
import PStar from '@/newComponents/PStar';

import './index.scss';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PArrow from '@/newComponents/PArrow';
import TokenTable from '../TokenTable';
import NFTList from '../NFTList';
const MAX = 5;

const Chain = memo(() => {
  const { chainNftsListMap } = useNFTs();
  const { totalOnChainAssetsBalance } = useAssetsStatistic();
  const { sourceMap, sourceMap2 } = useAllSources();
  const [starArr, setStarArr] = useState<string[]>();
  const [showMore, setShowMore] = useState<boolean>(false);
  const [activeExpand, setActiveExpand] = useState<string[]>([]);
  const [tableTab, setTableTab] = useState<string>();
  const sysConfig = useSelector((state) => state.sysConfig);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const connectedOnChainSources = useMemo(() => {
    return sourceMap.onChainAssetsSources;
  }, [sourceMap]);

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
    const tAM = Object.values(connectedOnChainSources).reduce(reduceF, {});
    return tAM;
  }, [connectedOnChainSources]);

  const sortedChainAssetsList = useMemo(() => {
    const l = Object.values(totalChainAssetsMap as any);
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
      );
    };
    let noStarL = l.filter((i: any) => !starArr?.includes(i.id));
    let hasStarL = l.filter((i: any) => starArr?.includes(i.id));

    noStarL = sortFn(noStarL);
    hasStarL = sortFn(hasStarL);
    return [...hasStarL, ...noStarL];
  }, [totalChainAssetsMap, starArr]);

  const showList = useMemo(() => {
    return showMore
      ? sortedChainAssetsList
      : sortedChainAssetsList.slice(0, MAX);
  }, [sortedChainAssetsList, showMore]);

  const handleShowMore = useCallback(() => {
    setShowMore((f) => !f);
  }, []);

  const balancePercentFn = useCallback(
    (i) => {
      const { totalBalance } = i;
      if (totalBalance === '0') {
        return '0';
      } else {
        const digit = div(
          Number(totalBalance),
          new BigNumber(totalOnChainAssetsBalance).toNumber()
        );
        return mul(Number(digit), 100).toFixed(2);
      }
    },
    [totalOnChainAssetsBalance]
  );
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
  const holdingTokenLogosFn = useCallback(
    (i) => {
      const l = Object.values(i.tokenListMap).map((i) => {
        return iconFn(i);
      });
      return l;
    },
    [sourceMap2, sourceMap]
  );

  const handleExpand = useCallback(
    (dataSource) => {
      if (activeExpand.includes(dataSource.id)) {
        setActiveExpand((arr) => {
          const newArr = [...arr];
          const idx = newArr.findIndex((i) => i === dataSource.id);
          newArr.splice(idx, 1);
          return newArr;
        });
      } else {
        setActiveExpand((arr) => {
          const newArr = [...arr, dataSource.id];
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
      if (assetsStarsMapObj.chain) {
        setStarArr(Object.keys(assetsStarsMapObj.chain));
      }
    }
  };
  const handleStar = useCallback(async (i) => {
    const { id: symbol } = i;
    const { assetsStarsMap: assetsStarsMapStr } =
      await chrome.storage.local.get(['assetsStarsMap']);
    if (assetsStarsMapStr) {
      const assetsStarsMapObj = JSON.parse(assetsStarsMapStr);
      if (assetsStarsMapObj.chain) {
        if (symbol in assetsStarsMapObj.chain) {
          delete assetsStarsMapObj.chain[symbol];
        } else {
          assetsStarsMapObj.chain[symbol] = 1;
        }
        await chrome.storage.local.set({
          assetsStarsMap: JSON.stringify(assetsStarsMapObj),
        });
      }
    } else {
      const obj = {
        chain: { [symbol]: 1 },
        token: {},
      };
      await chrome.storage.local.set({
        assetsStarsMap: JSON.stringify(obj),
      });
    }
    resetStarArr();
  }, []);
  const handleChangeTableTab = useCallback((i) => {
    setTableTab(i);
  }, []);
  const currentAccountNftsFn = useCallback(
    (id) => {
      const currentAccountNftsArr = chainNftsListMap[id];
      if (currentAccountNftsArr) {
        return currentAccountNftsArr;
      } else {
        return [];
      }
    },
    [chainNftsListMap]
  );
  useEffect(() => {
    resetStarArr();
  }, []);
  return (
    <section className="tableSection chain">
      <ul className="dataSourceItems">
        {showList.map((i: any) => {
          return (
            <li className="dataSourceItem" key={i.id}>
              <div className="mainInfo">
                <div className="left">
                  <PStar
                    open={starArr?.includes(i.id)}
                    onClick={() => {
                      handleStar(i);
                    }}
                  />
                  <img src={i.icon} alt="" className="sourceIcon" />
                  <div className="breif">
                    <div className="top">
                      <div className="name">{i.name}</div>
                    </div>
                    <div className="bottom">
                      <div className="balance">
                        ${formatNumeral(i.totalBalance)}
                      </div>
                      {/* <div className="percent">({balancePercentFn(i)}%)</div> */}
                    </div>
                  </div>
                </div>
                <div className="right">
                  <div className="tokensWrapper">
                    <div className="tokens">
                      <div className="label">Token</div>
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
              {activeExpand.includes(i.id) && (
                <>
                  <div className="extraInfo">
                    <div
                      className={`card ${
                        tableTab === 'Token' ? 'active' : ''
                      } `}
                      onClick={() => {
                        handleChangeTableTab('Token');
                      }}
                    >
                      <i className="iconfont icon-iconAmountForAttest"></i>
                      <div className="txtWrapper">
                        <div className="label">Tokens</div>
                        <div className="value">
                          ${formatNumeral(totalOnChainAssetsBalance)}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`card ${tableTab === 'NFT' ? 'active' : ''} `}
                      onClick={() => {
                        handleChangeTableTab('NFT');
                      }}
                    >
                      <i className="iconfont icon-iconAmountForAttest"></i>
                      <div className="txtWrapper">
                        <div className="label">NFT</div>
                        <div className="value">
                          {currentAccountNftsFn(i.id).length}
                        </div>
                      </div>
                    </div>
                  </div>
                  {tableTab === 'Token' && (
                    <TokenTable
                      title="Tokens"
                      id={i.id}
                      listMap={i.tokenListMap}
                    />
                  )}
                  {tableTab === 'NFT' && (
                    <NFTList list={currentAccountNftsFn(i.id)} />
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      {sortedChainAssetsList.length > MAX && (
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

export default Chain;
