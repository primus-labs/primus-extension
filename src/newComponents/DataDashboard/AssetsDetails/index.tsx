import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import BigNumber from 'bignumber.js';
import { setExSourcesAsync } from '@/store/actions';
import { sub, add, div, formatNumeral } from '@/utils/utils';

import { getUserInfo } from '@/services/api/achievements';

import useAllSources from '@/hooks/useAllSources';
import PButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import PStar from '@/newComponents/PStar';

import './index.scss';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PArrow from '@/newComponents/PArrow';

const tList = [
  { label: 'Portfolio', value: 'Portfolio' },
  { label: 'Token', value: 'Token' },
  { label: 'Chain', value: 'Chain' },
];
const AssetsDetails = memo(() => {
  const dispatch = useDispatch();
  const { sourceMap, sourceMap2 } = useAllSources();
  const navigate = useNavigate();
  const [ttt, setTtt] = useState('Portfolio');
  const [activeExpand, setActiveExpand] = useState();

  const [balanceVisible, setBalanceVisible] = useState<boolean>(true);

  const sysConfig = useSelector((state) => state.sysConfig);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const connectedSocialSources = useMemo(() => {
    return sourceMap.socialSources;
  }, [sourceMap]);
  const connectedExchangeSources = useMemo(() => {
    return sourceMap.exSources;
  }, [sourceMap]);
  console.log('22connectedSocialSources', sourceMap);
  const sortedConnectedExchangeSourcesList = useMemo(() => {
    let l = Object.values(connectedExchangeSources);
    let noStarL = l.filter((i: any) => !i.star);
    let hasStarL = l.filter((i: any) => !!i.star);
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
      );
    };
    noStarL = sortFn(noStarL);
    hasStarL = sortFn(hasStarL);
    return [...hasStarL, ...noStarL];
  }, [connectedExchangeSources]);

  const totalAssetsBalance = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { totalBalance } = curr;
      return add(prev.toNumber(), Number(totalBalance));
    };
    const bal = sortedConnectedExchangeSourcesList.reduce(
      reduceF,
      new BigNumber(0)
    );
    return `${bal.toFixed(2)}`;
  }, [sortedConnectedExchangeSourcesList]);
  const formatTotalBal = useMemo(() => {
    return totalAssetsBalance ? `$${formatNumeral(totalAssetsBalance)}` : '--';
  }, [totalAssetsBalance]);
  const handleExport = useCallback(() => {}, []);
  const handleAdd = useCallback(() => {
    navigate('/datas');
  }, [navigate]);
  const handleShow = useCallback(() => {
    setBalanceVisible((v) => !v);
  }, []);

  const handleShare = useCallback(() => {}, []);
  const handleMore = useCallback(() => {}, []);
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
        return digit.toFixed(2);
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

  const handleExpand = useCallback(
    (i) => {
      if (activeExpand === i.id) {
        setActiveExpand(undefined);
      } else {
        setActiveExpand(i.id);
      }
    },
    [activeExpand]
  );
  const handleStar = useCallback(
    async (i) => {
      i.star = !i.star;
      await chrome.storage.local.set({
        [i.id]: JSON.stringify(i),
      });
      dispatch(setExSourcesAsync());
    },
    [dispatch]
  );

  return (
    <div className="assetsDetails">
      <div className="title">
        <span>Data Overview</span>
        <div className="operations">
          <PButton
            type="text"
            text="Share on social media"
            suffix={<i className="iconfont icon-iconShare"></i>}
            onClick={handleShare}
          />
        </div>
      </div>
      <div className="content">
        <PPTabs
          list={tList}
          onChange={(p) => {
            setTtt(p);
          }}
          value={ttt}
        />
        <section className="tableSection">
          <ul className="dataSourceItems">
            {sortedConnectedExchangeSourcesList.map((i: any) => {
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
                            <span>{connectionNumFn(i)}</span>
                          </div>
                        </div>
                        <div className="bottom">
                          <div className="balance">${i.totalBalance}</div>
                          <div className="percent">
                            ({balancePercentFn(i)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="right">
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
                  {activeExpand === i.id && (
                    <>
                      <div className="extraInfo">
                        <div className="card">
                          <i className="iconfont icon-iconAmountForAttest"></i>
                          <div className="txtWrapper">
                            <div className="label">
                              Available for Attestation
                            </div>
                            <div className="value">$123.34</div>
                          </div>
                        </div>
                      </div>
                      <div className="expandInfo">
                        <div className="title">
                          <span>Tokens</span>
                          <div className="num">
                            ({Object.keys(i.tokenListMap).length})
                          </div>
                        </div>
                        <ul className="tokenItems">
                          <li className="tokenItem th">
                            <div className="token">Token</div>
                            <div className="fixed">Fixed</div>
                            <div className="flexible">Flexible</div>
                            <div className="totalAmount">Total Amount</div>
                            <div className="price">Price</div>
                            <div className="totalValue">Total Value</div>
                          </li>
                          {Object.values(i.tokenListMap).map((j: any) => {
                            return (
                              <li className="tokenItem tr" key={j.symbol}>
                                <div className="token">
                                  <img
                                    src={`${tokenLogoPrefix}icon${j.symbol}.png`}
                                    alt=""
                                  />
                                  <span>{j.symbol}</span>
                                </div>
                                <div className="fixed">
                                  {i.spotAccountTokenMap[j.symbol]?.amount ?? 0}
                                </div>
                                <div className="flexible">
                                  {i.flexibleAccountTokenMap[j.symbol]
                                    ?.amount ?? 0}
                                </div>
                                <div className="totalAmount">{j.amount}</div>
                                <div className="price">{j.price}</div>
                                <div className="totalValue">{j.value}</div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>

          <PButton
            type="text"
            text="View More"
            suffix={<i className="iconfont icon-DownArrow"></i>}
            onClick={handleMore}
            className="moreBtn"
          />
        </section>
      </div>
    </div>
  );
});

export default AssetsDetails;
