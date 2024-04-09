import React, { memo, useCallback, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BigNumber from 'bignumber.js';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import useMsgs from '@/hooks/useMsgs';
import useAllSources from '@/hooks/useAllSources';
import useNFTs from '@/hooks/useNFTs';
import {
  sub,
  div,
  mul,
  formatNumeral,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
} from '@/utils/utils';
import PButton from '@/newComponents/PButton';
import PStar from '@/newComponents/PStar';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PArrow from '@/newComponents/PArrow';
import NFTList from '../NFTList';
import TokenTable from '../TokenTable';
import './index.scss';

const MAX = 5;

const AssetsDetails = memo(() => {
  const { accountsNftsListMap } = useNFTs();
  const { addMsg } = useMsgs();
  const { totalAssetsBalance, metamaskAssets, tokenIconFn } =
    useAssetsStatistic();

  const { sourceMap, sourceMap2 } = useAllSources();
  const [pageSize, setPageSize] = useState<number>(1);
  const [activeExpand, setActiveExpand] = useState<string[]>([]);
  const [tableTab, setTableTab] = useState<string>('Token');
  const [starArr, setStarArr] = useState<string[]>();
  const sysConfig = useSelector((state) => state.sysConfig);
  const nfts = useSelector((state) => state.nfts);

  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const connectedExchangeSources = useMemo(() => {
    return sourceMap.exSources;
  }, [sourceMap]);
  const connectedOnChainSources = useMemo(() => {
    return sourceMap.onChainAssetsSources;
  }, [sourceMap]);
  const connectedAssetsSourcesList = useMemo(() => {
    let l = Object.values(connectedExchangeSources);
    if (Object.keys(connectedOnChainSources).length > 0) {
      // const newOnChainList = Object.values(connectedOnChainSources).map(
      //   (i: any) => {
      //     const { name, icon } = WALLETMAP['metamask'];
      //     return Object.assign(i, { name, icon, id: i.address });
      //   }
      // );
      const newOnChainList = [metamaskAssets];
      l = l.concat(newOnChainList);
    }
    return l;
  }, [connectedExchangeSources, connectedOnChainSources, metamaskAssets]);
  const sortedConnectedAssetsSourcesList = useMemo(() => {
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
      );
    };
    let noStarL = connectedAssetsSourcesList.filter(
      (i: any) => !starArr?.includes(i.id)
    );
    let hasStarL = connectedAssetsSourcesList.filter((i: any) =>
      starArr?.includes(i.id)
    );
    noStarL = sortFn(noStarL);
    hasStarL = sortFn(hasStarL);
    console.log('222sortedConnectedAssetsSourcesList', noStarL, hasStarL); //delete
    return [...hasStarL, ...noStarL];
  }, [connectedAssetsSourcesList, starArr]);
  const totalPageSize = useMemo(() => {
    return Math.ceil(sortedConnectedAssetsSourcesList.length / MAX);
  }, [sortedConnectedAssetsSourcesList]);
  const showList = useMemo(() => {
    const showLen = MAX * pageSize;
    return sortedConnectedAssetsSourcesList.slice(0, showLen);
  }, [sortedConnectedAssetsSourcesList, pageSize]);

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

  const balancePercentFn = useCallback(
    (i) => {
      const { totalBalance } = i;
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
  const connectionNumFn = useCallback(
    (i) => {
      const lowerCaseSourceName = i.name.toLowerCase();
      if (lowerCaseSourceName === 'web3 wallet') {
        return Object.values(sourceMap.onChainAssetsSources).length;
      } else {
        if (sourceMap2?.[lowerCaseSourceName]) {
          return 1;
        } else {
          return 0;
        }
      }
    },
    [sourceMap2, sourceMap]
  );
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
    [sortListMapFn, sortListMapFn]
  );
  const totalBalanceForAttestFn = useCallback((activeDataSouceUserInfo) => {
    let totalBalance = '0';

    if (activeDataSouceUserInfo) {
      const { id: dataSourceId } = activeDataSouceUserInfo;
      if (dataSourceId === 'okx') {
        totalBalance = getTotalBalFromNumObjAPriceObj(
          activeDataSouceUserInfo?.tradingAccountTokenAmountObj,
          activeDataSouceUserInfo?.tokenPriceMap
        );
      } else if (dataSourceId === 'binance') {
        totalBalance = getTotalBalFromAssetsMap(
          activeDataSouceUserInfo?.spotAccountTokenMap
        );
      } else {
        totalBalance = activeDataSouceUserInfo?.totalBalance;
      }
    }

    return new BigNumber(totalBalance).toFixed(2);
  }, []);

  const handleExpand = useCallback(
    (dataSource) => {
      if (dataSource.expried) {
        addMsg({
          type: 'warn',
          title: `${dataSource.name} data login session has expired`,
          desc: 'Please reconnect the data source to get real-time information.',
          link: '/datas',
        });
      }

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
      if (assetsStarsMapObj.portfolio) {
        setStarArr(Object.keys(assetsStarsMapObj.portfolio));
      }
    }
  };
  const handleStar = useCallback(async (i) => {
    const { id: symbol } = i;
    const { assetsStarsMap: assetsStarsMapStr } =
      await chrome.storage.local.get(['assetsStarsMap']);
    if (assetsStarsMapStr) {
      const assetsStarsMapObj = JSON.parse(assetsStarsMapStr);
      if (assetsStarsMapObj.portfolio) {
        if (symbol in assetsStarsMapObj.portfolio) {
          delete assetsStarsMapObj.portfolio[symbol];
        } else {
          assetsStarsMapObj.portfolio[symbol] = 1;
        }
        await chrome.storage.local.set({
          assetsStarsMap: JSON.stringify(assetsStarsMapObj),
        });
      }
    } else {
      const obj = {
        token: {},
        chain: {},
        portfolio: { [symbol]: 1 },
      };
      await chrome.storage.local.set({
        assetsStarsMap: JSON.stringify(obj),
      });
    }
    resetStarArr();
  }, []);

  const currentAccountNftsFn = useCallback(
    (id) => {
      const currentAccountNftsArr = accountsNftsListMap[id];
      if (currentAccountNftsArr) {
        return currentAccountNftsArr;
      } else {
        return [];
      }
    },
    [accountsNftsListMap]
  );
  const handleChangeTableTab = useCallback((i) => {
    setTableTab(i);
  }, []);

  return (
    <section className="tableSection portfolio">
      <ul
        className={`dataSourceItems ${
          sortedConnectedAssetsSourcesList.length > MAX ? 'noMb' : ''
        }`}
      >
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
                      <div className="num">
                        <i className="iconfont icon-iconConnection"></i>
                        <span>
                          {connectionNumFn(i) > 1
                            ? connectionNumFn(i)
                            : i.userInfo?.userName ?? i.apiKey ?? i.address}
                        </span>
                      </div>
                    </div>
                    <div className="bottom">
                      <div className="balance">
                        ${formatNumeral(i.totalBalance)}
                      </div>
                      <div className="percent">({balancePercentFn(i)}%)</div>
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
                  {['okx', 'binance'].includes(i.id) && (
                    <div className="extraInfo">
                      <div className="card availableForAttestation">
                        <i className="iconfont icon-iconAmountForAttest"></i>
                        <div className="txtWrapper">
                          <div className="label">Available for Attestation</div>
                          <div className="value">
                            ${totalBalanceForAttestFn(i)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {i.id === 'metamask' && (
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
                          <div className="label">Token</div>
                          <div className="value">
                            ${formatNumeral(i.totalBalance)}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`card ${
                          currentAccountNftsFn(i.id).length === 0
                            ? 'disabled'
                            : tableTab === 'NFT'
                            ? 'active'
                            : ''
                        } `}
                        onClick={() => {
                          currentAccountNftsFn(i.id).length > 0 &&
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
                  )}

                  {((i.id.startsWith('0x') && tableTab === 'Token') ||
                    !i.id.startsWith('0x')) && (
                    <TokenTable
                      title="Tokens"
                      id={i.id}
                      listMap={sortListMapFn(i.tokenListMap)}
                      others={
                        i.id === 'binance'
                          ? {
                              spotAccountTokenMap: i.spotAccountTokenMap,
                              flexibleAccountTokenMap:
                                i.flexibleAccountTokenMap,
                            }
                          : {}
                      }
                    />
                  )}
                  {i.id.startsWith('0x') && tableTab === 'NFT' && (
                    <NFTList list={currentAccountNftsFn(i.id)} />
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      {sortedConnectedAssetsSourcesList.length > MAX && (
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

export default AssetsDetails;
