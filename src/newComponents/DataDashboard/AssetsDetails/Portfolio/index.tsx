import React, { memo, useCallback, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';
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
  formatAddress,
} from '@/utils/utils';
import PTooltip from '@/newComponents/PTooltip';
import PButton from '@/newComponents/PButton';
import PStar from '@/newComponents/PStar';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PArrow from '@/newComponents/PArrow';
import PSelect from '@/newComponents/PSelect';
import NFTList from '../NFTList';
import TokenTable from '../TokenTable';
import './index.scss';
import { UserState } from '@/types/store';

const MAX = 5;

const AssetsDetails = memo(() => {
  const { accountsNftsListMap } = useNFTs();
  console.log('222accountsNftsListMap', accountsNftsListMap); //delete
  const { addMsg } = useMsgs();
  const {
    totalAssetsBalance,
    metamaskAssets,
    tokenIconFn,
    sortedHoldingTokensList,
    sortedChainAssetsList,
  } = useAssetsStatistic();

  const { sourceMap, sourceMap2, sortedConnectedOnChainAssetsSourcesList } =
    useAllSources();
  const [pageSize, setPageSize] = useState<number>(1);
  const [activeExpand, setActiveExpand] = useState<string[]>([]);
  const [tableTab, setTableTab] = useState<string>('Token');
  const [starArr, setStarArr] = useState<string[]>();
  const [accountsForm, setAccountsForm] = useState<object>({ metamask: 'All' });
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const nfts = useSelector((state: UserState) => state.nfts);

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
  console.log(
    '222useAssetsStatistic',
    sortedConnectedAssetsSourcesList,
    sortedHoldingTokensList,
    sortedChainAssetsList
  ); //delete
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
      let tB = i.totalBalance;
      if (i.id === 'metamask') {
        const currentAccount = accountsForm['metamask'];
        if (currentAccount !== 'All') {
          tB = sourceMap2[currentAccount].totalBalance;
        }
      }
      if (
        !tB ||
        !totalAssetsBalance ||
        Number(tB) === 0 ||
        Number(totalAssetsBalance) === 0
      ) {
        return '0';
      } else {
        const digit = div(
          Number(tB),
          new BigNumber(totalAssetsBalance).toNumber()
        );
        return mul(Number(digit), 100).toFixed(2);
      }
    },
    [totalAssetsBalance, accountsForm]
  );

  const connectionNumFn = useCallback(
    (i) => {
      const lowerCaseSourceName = i.id;
      if (lowerCaseSourceName === 'metamask') {
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
  const itemTotalBalanceFn = useCallback(
    (i) => {
      let tB = i.totalBalance;
      if (i.id === 'metamask') {
        const currentAccount = accountsForm['metamask'];
        if (currentAccount !== 'All') {
          tB = sourceMap2[currentAccount].totalBalance;
        }
      }
      return formatNumeral(tB);
    },
    [accountsForm]
  );
  const itemTokenListMapFn = useCallback(
    (i) => {
      let tM = i.tokenListMap;
      if (i.id === 'metamask') {
        const currentAccount = accountsForm['metamask'];
        if (currentAccount !== 'All') {
          tM = sourceMap2[currentAccount].tokenListMap;
        }
      }
      return tM;
    },
    [accountsForm]
  );
  const holdingTokenLogosFn = useCallback(
    (i) => {
      const l = sortListMapFn(itemTokenListMapFn(i)).map((j) => {
        return tokenIconFn(j, i.id);
      });
      return l;
    },
    [sortListMapFn, sortListMapFn, itemTokenListMapFn]
  );
  const totalBalanceForAttestFn = useCallback((activeDataSouceUserInfo) => {
    let totalBalance = '0';

    if (activeDataSouceUserInfo) {
      const { id: dataSourceId } = activeDataSouceUserInfo;
      if (dataSourceId === 'binance') {
        totalBalance = getTotalBalFromNumObjAPriceObj(
          activeDataSouceUserInfo?.tradingAccountTokenAmountObj,
          activeDataSouceUserInfo?.tokenPriceMap
        );
      } else {
        totalBalance = activeDataSouceUserInfo?.totalBalance;
      }
    }

    return new BigNumber(totalBalance).toFixed(2);
  }, []);
  const tootipFn = useCallback((activeDataSouceUserInfo) => {
    if (activeDataSouceUserInfo) {
      const { id: dataSourceId } = activeDataSouceUserInfo;
      if (dataSourceId === 'okx') {
        return 'Assets in Trading account';
      } else if (dataSourceId === 'binance') {
        return 'Assets in Spot account';
      }
    }
    return '';
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
    (i) => {
      const { id, address } = i;
      let currentAccountNftsArr =
        accountsForm[id] && accountsForm[id] !== 'All'
          ? accountsNftsListMap[accountsForm[id]]
          : Object.values(accountsNftsListMap).flat();
      console.log(
        '222currentAccountNftsFn',
        accountsNftsListMap,
        accountsForm[id]
      ); //delete
      if (currentAccountNftsArr) {
        return currentAccountNftsArr;
      } else {
        return [];
      }
    },
    [accountsNftsListMap, accountsForm]
  );
  const handleChangeTableTab = useCallback((i) => {
    setTableTab(i);
  }, []);
  const accountsListFn = useCallback(
    (i) => {
      if (i.id === 'metamask') {
        let l = sortedConnectedOnChainAssetsSourcesList.map((i) => {
          const illlegalAddr = utils.getAddress(i.address);
          return {
            label: formatAddress(illlegalAddr),
            value: i.address,
          };
        });
        l.unshift({
          label: 'Show all accounts',
          value: 'All',
        });
        return l;
      }
      return [];
    },
    [sortedConnectedOnChainAssetsSourcesList]
  );
  const handleChangeAccountsForm = useCallback((k, v) => {
    setAccountsForm((f) => {
      return { ...f, [k]: v };
    });
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
                          {connectionNumFn(i) > 1 ? (
                            i.id === 'metamask' ? (
                              <PSelect
                                className="accountsSelect"
                                placeholder=""
                                list={accountsListFn(i)}
                                onChange={(p) => {
                                  handleChangeAccountsForm(i.id, p);
                                }}
                                value={accountsForm[i.id]}
                                showSelf={true}
                              />
                            ) : (
                              connectionNumFn(i)
                            )
                          ) : (
                            i.userInfo?.userName ?? i.apiKey ?? i.address
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="bottom">
                      <div className="balance">${itemTotalBalanceFn(i)}</div>
                      <div className="percent">({balancePercentFn(i)}%)</div>
                    </div>
                  </div>
                </div>
                {Object.keys(itemTokenListMapFn(i)).length > 0 && (
                  <div className="right">
                    <div className="tokensWrapper">
                      <PArrow
                        onClick={() => {
                          handleExpand(i);
                        }}
                      />
                      {!activeExpand.includes(i.id) && (
                        <div className="tokens">
                          <div className="label">Token</div>
                          <SplicedIcons
                            list={holdingTokenLogosFn(i)}
                            max={3}
                            plusSign={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {activeExpand.includes(i.id) && (
                <>
                  {['binance'].includes(i.id) && (
                    <div className="extraInfo">
                      <div className="card availableForAttestation">
                        <i className="iconfont icon-iconAmountForAttest"></i>
                        <div className="txtWrapper">
                          <div className="label">
                            <span>Available for Attestation</span>
                            <PTooltip title={tootipFn(i)}>
                              <PButton
                                type="icon"
                                icon={
                                  <i className="iconfont icon-iconInfo"></i>
                                }
                                onClick={() => {}}
                                className="tooltipBtn"
                              />
                            </PTooltip>
                          </div>
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
                          <div className="label">
                            <div>Token</div>
                            <span>
                              ({sortListMapFn(itemTokenListMapFn(i)).length})
                            </span>
                          </div>
                          <div className="value">${itemTotalBalanceFn(i)}</div>
                        </div>
                      </div>
                      <div
                        className={`card ${
                          currentAccountNftsFn(i).length === 0
                            ? 'disabled'
                            : tableTab === 'NFT'
                            ? 'active'
                            : ''
                        } `}
                        onClick={() => {
                          currentAccountNftsFn(i).length > 0 &&
                            handleChangeTableTab('NFT');
                        }}
                      >
                        <i className="iconfont icon-iconAmountForAttest"></i>
                        <div className="txtWrapper">
                          <div className="label">NFT</div>
                          <div className="value">
                            {currentAccountNftsFn(i).length}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {((i.id === 'metamask' && tableTab === 'Token') ||
                    i.id !== 'metamask') && (
                    <TokenTable
                      title={i.id === 'metamask' ? '' : 'Tokens'}
                      id={i.id}
                      listMap={sortListMapFn(itemTokenListMapFn(i))}
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
                  {i.id === 'metamask' && tableTab === 'NFT' && (
                    <NFTList list={currentAccountNftsFn(i)} />
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
