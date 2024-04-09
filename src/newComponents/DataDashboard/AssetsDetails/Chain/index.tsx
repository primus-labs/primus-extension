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
  const { totalOnChainAssetsBalance, sortedChainAssetsList, tokenIconFn } =
    useAssetsStatistic();
  const { sourceMap, sourceMap2 } = useAllSources();
  const [starArr, setStarArr] = useState<string[]>();
  const [showMore, setShowMore] = useState<boolean>(false);
  const [activeExpand, setActiveExpand] = useState<string[]>([]);
  const [tableTab, setTableTab] = useState<string>('Token');

  const sortedChainAssetsList2 = useMemo(() => {
    const l = sortedChainAssetsList;

    let noStarL = l.filter((i: any) => !starArr?.includes(i.id));
    let hasStarL = l.filter((i: any) => starArr?.includes(i.id));

    return [...hasStarL, ...noStarL];
  }, [sortedChainAssetsList, starArr]);

  const showList = useMemo(() => {
    return showMore
      ? sortedChainAssetsList2
      : sortedChainAssetsList2.slice(0, MAX);
  }, [sortedChainAssetsList2, showMore]);

  const handleShowMore = useCallback(() => {
    setShowMore((f) => !f);
  }, []);

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
      const l = sortListMapFn(i.tokenListMap).map((i) => {
        return tokenIconFn(i);
      });
      return l;
    },
    [sourceMap2, sortListMapFn]
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
                      <SplicedIcons
                        list={holdingTokenLogosFn(i)}
                        max={3}
                        plusSign={false}
                      />
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
                      listMap={sortListMapFn(i.tokenListMap)}
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
      {sortedChainAssetsList2.length > MAX && (
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
