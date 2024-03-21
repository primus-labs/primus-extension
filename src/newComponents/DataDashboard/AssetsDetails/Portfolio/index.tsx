import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BigNumber from 'bignumber.js';
import {
  setExSourcesAsync,
  setOnChainAssetsSourcesAsync,
} from '@/store/actions';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import useMsgs from '@/hooks/useMsgs';
import useAllSources from '@/hooks/useAllSources';
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
import PButton from '@/newComponents/PButton';
import PStar from '@/newComponents/PStar';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PArrow from '@/newComponents/PArrow';
import TokenTable from '../TokenTable';
import './index.scss';

const MAX = 5;

const AssetsDetails = memo(() => {
  const { addMsg } = useMsgs();
  const { totalAssetsBalance } = useAssetsStatistic();
  const dispatch = useDispatch();
  const { sourceMap, sourceMap2 } = useAllSources();

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
  const sortedConnectedAssetsSourcesList = useMemo(() => {
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
      );
    };
    let noStarL = connectedAssetsSourcesList.filter((i: any) => !i.star);
    let hasStarL = connectedAssetsSourcesList.filter((i: any) => !!i.star);
    noStarL = sortFn(noStarL);
    hasStarL = sortFn(hasStarL);
    return [...hasStarL, ...noStarL];
  }, [connectedAssetsSourcesList]);

  const showList = useMemo(() => {
    return showMore
      ? sortedConnectedAssetsSourcesList
      : sortedConnectedAssetsSourcesList.slice(0, MAX);
  }, [sortedConnectedAssetsSourcesList, showMore]);

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
  const holdingTokenLogosFn = useCallback(
    (i) => {
      const l = Object.keys(i.tokenListMap).map((i) => {
        return `${tokenLogoPrefix}icon${i}.png`;
      });
      return l;
    },
    [sourceMap2, sourceMap]
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

    return totalBalance;
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
  const handleStar = useCallback(
    async (i) => {
      i.star = !i.star;
      if (i.address?.startsWith('0x')) {
        const newObj = { ...connectedOnChainSources };
        newObj[i.address] = i;
        await chrome.storage.local.set({
          onChainAssetsSources: JSON.stringify(newObj),
        });
        dispatch(setOnChainAssetsSourcesAsync());
      } else {
        if (i.type === 'Assets') {
          await chrome.storage.local.set({
            [i.id]: JSON.stringify(i),
          });
          dispatch(setExSourcesAsync());
        }
      }
    },
    [dispatch, connectedOnChainSources]
  );
  return (
    <section className="tableSection portfolio">
      <ul className="dataSourceItems">
        {showList.map((i: any) => {
          return (
            <li className="dataSourceItem" key={i.id}>
              <div className="mainInfo">
                <div className="left">
                  <PStar
                    open={i.star}
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
                  {['okx', 'binance'].includes(i.id) && (
                    <div className="extraInfo">
                      <div className="card">
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
                  <TokenTable
                    title="Tokens"
                    id={i.id}
                    listMap={i.tokenListMap}
                    others={
                      i.id === 'binance'
                        ? {
                            spotAccountTokenMap: i.spotAccountTokenMap,
                            flexibleAccountTokenMap: i.flexibleAccountTokenMap,
                          }
                        : {}
                    }
                  />
                </>
              )}
            </li>
          );
        })}
      </ul>
      {sortedConnectedAssetsSourcesList.length > MAX && (
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

export default AssetsDetails;
