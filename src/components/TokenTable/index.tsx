import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import PFilter from '@/components/PFilter';
import { setSysConfigAction } from '@/store/actions';
import iconInfoGray from '@/assets/img/iconInfoGray.svg';

import { sub, postMsg, formatNumeral, formatAddress, div } from '@/utils/utils';
import { SUPPORRTEDQUERYCHAINMAP } from '@/config/constants';
import type { UserState } from '@/types/store';
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceList/DataSourceItem';
import type { Dispatch, ReactNode } from 'react';
import type { ChainsAssetsMap, TokenMap } from '@/types/dataSource';
import './index.sass';

interface TokenTableProps {
  list: TokenMap[] | DataSourceItemType[];
  type?: string;
  flexibleAccountTokenMap?: any;
  spotAccountTokenMap?: any;
  name?: string;
  headerRightContent?: ReactNode;
  showFilter?: boolean;
  allChainMap?: ChainsAssetsMap;
}

const accountList = [
  {
    label: 'All',
    disabled: false,
    defaultValue: true,
  },
  {
    label: 'Spot',
    disabled: false,
    defaultValue: false,
  },
  {
    label: 'Flexible',
    disabled: false,
    defaultValue: false,
  },
];
const chainList = [
  {
    label: 'All',
    disabled: false,
    defaultValue: true,
  },
  {
    label: 'Arbitrum One',
    disabled: false,
    defaultValue: false,
  },
  {
    label: 'BSC',
    disabled: false,
    defaultValue: false,
  },
  {
    label: 'Ethereum',
    disabled: false,
    defaultValue: false,
  },
  {
    label: 'Polygon',
    disabled: false,
    defaultValue: false,
  },
  {
    label: 'Avalanche',
    disabled: false,
    defaultValue: false,
  },
  {
    label: 'Optimism',
    disabled: false,
    defaultValue: false,
  },
];
const TokenTable: React.FC<TokenTableProps> = memo(
  ({
    list,
    flexibleAccountTokenMap,
    spotAccountTokenMap,
    name,
    headerRightContent,
    showFilter,
    allChainMap,
  }) => {
    // console.log(
    //   'TokenTable-list',
    //   list,
    //   name,
    //   spotAccountTokenMap,
    //   flexibleAccountTokenMap,
    //   allChainMap
    // );
    const [filterAccount, setFilterAccount] = useState<string | undefined>();
    const [activeItem, setActiveItem] = useState<string>();

    const dispatch: Dispatch<any> = useDispatch();

    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );

    const tokenLogoPrefix = useMemo(() => {
      // console.log('TokenTable-sysConfig', sysConfig);
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    const activeShowFilter = useMemo(() => {
      return name === 'binance' || showFilter;
    }, [name, showFilter]);
    const filterList = useMemo(() => {
      if (name === 'binance') {
        return accountList;
      }
      if (showFilter) {
        if (allChainMap) {
          const arr = chainList.filter(
            (i) => i.label in allChainMap || i.label === 'All'
          );
          return arr;
        }
        return chainList;
      }
      return accountList;
    }, [name, showFilter, allChainMap]);
    const currentList = useMemo(() => {
      if (filterAccount === undefined || filterAccount === 'All') {
        return list;
      }
      if (name === 'binance') {
        if (
          filterAccount === 'Spot' &&
          typeof spotAccountTokenMap === 'object'
        ) {
          return Object.values(spotAccountTokenMap);
        }
        if (
          filterAccount === 'Flexible' &&
          typeof flexibleAccountTokenMap === 'object'
        ) {
          return Object.values(flexibleAccountTokenMap);
        }
      }
      if (showFilter && allChainMap && filterAccount) {
        const curChainMap =
          allChainMap[filterAccount as keyof typeof allChainMap];
        if (curChainMap) {
          return Object.values(curChainMap['tokenListMap']);
        } else {
          return list
        }
      }
      return list;
    }, [
      list,
      flexibleAccountTokenMap,
      spotAccountTokenMap,
      filterAccount,
      name,
      allChainMap,
      showFilter,
    ]);
    const activeList = useMemo(() => {
      return (currentList as TokenMap[]).sort((a, b) =>
        sub(Number(b.value), Number(a.value)).toNumber()
      );
    }, [currentList]);

    const getSysConfig = useCallback(async () => {
      const padoServicePortListener = async function (message: any) {
        if (message.resMethodName === 'getSysConfig') {
          const { res } = message;
          console.log('page_get:getSysConfig:', message.res);
          if (res) {
            const configMap = message.res.reduce((prev: any, curr: any) => {
              const { configName, configValue } = curr;
              prev[configName] = configValue;
              return prev;
            }, {});
            dispatch(setSysConfigAction(configMap));
          } else {
            //alert('getSysConfig network error');
            console.log('getSysConfig network error');
          }
        }
      };
      padoServicePort.onMessage.addListener(padoServicePortListener);
      postMsg(padoServicePort, {
        fullScreenType: 'padoService',
        reqMethodName: 'getSysConfig',
      });
      console.log('page_send:getSysConfig request', padoServicePort);
    }, [dispatch, padoServicePort]);
    const liClassName = useCallback(
      (item: TokenMap) => {
        let cN = 'tokenItem tr';
        if (activeShowFilter) {
          cN += ' new';
          if (activeItem === item.symbol) {
            if (
              spotAccountTokenMap[item.symbol]?.amount > 0 ||
              flexibleAccountTokenMap[item.symbol]?.amount > 0
            ) {
              cN += ' expand';
            }
            if (
              spotAccountTokenMap[item.symbol]?.amount > 0 &&
              flexibleAccountTokenMap[item.symbol]?.amount > 0
            ) {
              cN += ' expandPlus';
            }
          }
        }
        return cN;
      },
      [
        activeItem,
        spotAccountTokenMap,
        flexibleAccountTokenMap,
        activeShowFilter,
      ]
    );

    const handleCheckDetail = (symbol: string) => {
      const activeS = symbol === activeItem ? undefined : symbol;
      setActiveItem(activeS);
    };
    const handleChangeFilter = useCallback(
      (filterAccount: string | undefined) => {
        setFilterAccount(filterAccount);
        setActiveItem(undefined);
      },
      []
    );
    // const onChainTokenLogoFn = useCallback(
    //   (item: TokenMap) => {
    //     let activeImg = null;
    //     if (item?.isNative) {
    //       activeImg = `${tokenLogoPrefix}icon${item.symbol}.png`;
    //       return <img src={activeImg} alt="" />;
    //     }
    //     if (item?.logo) {
    //       activeImg = item.logo;
    //       return <img src={activeImg} alt="" />;
    //     }
    //     return <div className="defaultTokenImg"></div>;
    //   },
    //   [tokenLogoPrefix]
    // );

    const onChainTokenLogoFn = useCallback(
      (item: TokenMap) => {
        let activeImg = null;
        if (name) {
          if (name === 'on-chain' || showFilter) {
            if (item?.isNative) {
              activeImg = `${tokenLogoPrefix}icon${item.symbol}.png`;
              return <img src={activeImg} alt="" />;
            }
            if (item?.address) {
              if (item?.logo) {
                activeImg = item.logo;
                const chainImg =
                  SUPPORRTEDQUERYCHAINMAP[
                    item.chain as keyof typeof SUPPORRTEDQUERYCHAINMAP
                  ].icon;
                return (
                  <div className="syntheticLogo">
                    <img className="tokenLogo" src={activeImg} alt="" />
                    <img className="chainLogo" src={chainImg} alt="" />
                  </div>
                );
              }

              return <div className="defaultTokenImg"></div>;
            }
            // if (item?.logo) {
            //   activeImg = item.logo;
            //   return <img src={activeImg} alt="" />;
            // }
            return <div className="defaultTokenImg"></div>;
          } else {
            activeImg = `${tokenLogoPrefix}icon${item.symbol}.png`;
            return <img src={activeImg} alt="" />;
          }
        } else {
          if (item?.isNative) {
            activeImg = `${tokenLogoPrefix}icon${item.symbol}.png`;
            return <img src={activeImg} alt="" />;
          }
          // if (item?.logo) {
          //   activeImg = item.logo;
          //   return <img src={activeImg} alt="" />;
          // }
          // if (item?.address) {
          //   return <div className="defaultTokenImg"></div>;
          // }
          if (item?.address) {
            if (item?.logo) {
              activeImg = item.logo;
              const chainImg =
                SUPPORRTEDQUERYCHAINMAP[
                  item.chain as keyof typeof SUPPORRTEDQUERYCHAINMAP
                ].icon;
              return (
                <div className="syntheticLogo">
                  <img className="tokenLogo" src={activeImg} alt="" />
                  <img className="chainLogo" src={chainImg} alt="" />
                </div>
              );
            }

            return <div className="defaultTokenImg"></div>;
          }
          activeImg = `${tokenLogoPrefix}icon${item.symbol}.png`;
          return <img src={activeImg} alt="" />;
        }
      },
      [tokenLogoPrefix, name, showFilter]
    );

    useEffect(() => {
      if (!sysConfig.TOKEN_LOGO_PREFIX) {
        getSysConfig();
      }
    }, [sysConfig]);
    const tokenSymbolFn = useCallback((item: TokenMap) => {
      if (item?.address) {
        const symbolAAddrArr = item.symbol.split('---');
        // const formatAddr = formatAddress(item.address, 0, 4, '**');
        // const formatSymbol = `${symbolAAddrArr[0]}(${formatAddr})`;
        const formatSymbol = `${symbolAAddrArr[0]}`;
        return formatSymbol;
      } else {
        return item.symbol;
      }
    }, []);
    useEffect(() => {
      setFilterAccount(undefined);
    }, [name]);

    return (
      <section className="tokenListWrapper assets">
        <header>
          <span>Profile</span>
          {headerRightContent}
        </header>
        <ul className="tokens">
          <li
            className={activeShowFilter ? 'tokenItem th new' : 'tokenItem th'}
            key="th"
          >
            <div className="innerWrapper">
              <div className="token">Token</div>
              <div className="price">Price</div>
              <div className="amount">Amount</div>
              <div className="value">USD Value</div>
            </div>
            {activeShowFilter && (
              <div
                className={
                  name === 'on-chain' || showFilter
                    ? 'accountFilterWrapper moreWidthFilterWrapper'
                    : 'accountFilterWrapper'
                }
              >
                <PFilter onChange={handleChangeFilter} list={filterList} />
              </div>
            )}
          </li>
          {(activeList as TokenMap[]).length > 0 ? (
            (activeList as TokenMap[]).map((item) => {
              return (
                <li className={liClassName(item)} key={item.symbol}>
                  <div className="innerWrapper">
                    <div className="token">
                      {onChainTokenLogoFn(item)}
                      {/* {(name === 'on-chain' || showFilter) &&
                        onChainTokenLogoFn(item)} */}
                      {/* {!(name === 'on-chain' || showFilter) &&
                        tokenLogoPrefix && (
                          <img
                            src={`${tokenLogoPrefix}icon${item.symbol}.png`}
                            alt=""
                          />
                        )} */}
                      {/* <span>{item.symbol}</span> */}
                      <span>{tokenSymbolFn(item)}</span>
                    </div>
                    <div className="price">
                      {'$' +
                        (item.price === '0'
                          ? '--'
                          : formatNumeral(item.price, { decimalPlaces: 4 }))}
                    </div>
                    <div className="amount">
                      {formatNumeral(item.amount, { decimalPlaces: 6 })}
                    </div>
                    <div className="value">
                      {'$' + formatNumeral(item.value)}
                    </div>
                  </div>
                  {name === 'binance' && filterAccount === 'All' && (
                    <div
                      className="arrowWrapper"
                      onClick={() => handleCheckDetail(item.symbol)}
                    ></div>
                  )}
                  {(spotAccountTokenMap?.[item.symbol] ||
                    flexibleAccountTokenMap?.[item.symbol]) &&
                    activeItem === item.symbol &&
                    filterAccount === 'All' && (
                      <div className="detailWrapper">
                        {spotAccountTokenMap[item.symbol]?.amount > 0 && (
                          <div className="descItem">
                            <div className="token">
                              <div className="label">Spot</div>
                            </div>
                            <div className="price"></div>
                            <div className="amount">
                              {formatNumeral(
                                spotAccountTokenMap[item.symbol]?.amount || '0',
                                { decimalPlaces: 6 }
                              )}
                            </div>
                            <div className="value">
                              {'$' +
                                formatNumeral(
                                  spotAccountTokenMap[item.symbol]?.value || '0'
                                )}
                            </div>
                          </div>
                        )}
                        {flexibleAccountTokenMap[item.symbol]?.amount > 0 && (
                          <div className="descItem">
                            <div className="token">
                              <div className="label">Flexible</div>
                            </div>
                            <div className="price"></div>
                            <div className="amount">
                              {formatNumeral(
                                flexibleAccountTokenMap[item.symbol]?.amount ||
                                  '0',
                                { decimalPlaces: 6 }
                              )}
                            </div>
                            <div className="value">
                              {'$' +
                                formatNumeral(
                                  flexibleAccountTokenMap[item.symbol]?.value ||
                                    '0'
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </li>
              );
            })
          ) : (
            <li className="emptyContent">
              <img src={iconInfoGray} alt="" />
              <h1>No results</h1>
              <h2>
                You don’t have any assets in{' '}
                {filterAccount === 'Flexible' ? 'flexible' : 'spot'} account.
              </h2>
            </li>
          )}
        </ul>
      </section>
    );
  }
);

export default TokenTable;
