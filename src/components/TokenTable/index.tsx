import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sub, postMsg, formatNumeral } from '@/utils/utils';
import type { TokenMap } from '@/components/DataSourceOverview/DataSourceItem';
import type { UserState } from '@/store/reducers';
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem';
import PFilter from '@/components/PFilter';
import type { Dispatch } from 'react';
import { setSysConfigAction } from '@/store/actions';
import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import './index.sass';

interface TokenTableProps {
  list: TokenMap[] | DataSourceItemType[];
  type?: string;
  flexibleAccountTokenMap?: any;
  spotAccountTokenMap?: any;
  name?: string;
}

const TokenTable: React.FC<TokenTableProps> = ({
  list,
  flexibleAccountTokenMap,
  spotAccountTokenMap,
  name,
}) => {
  // console.log('TokenTable-list', list,name,spotAccountTokenMap,flexibleAccountTokenMap);
  const [filterAccount, setFilterAccount] = useState<string | undefined>();
  const [activeItem, setActiveItem] = useState<string>();
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const tokenLogoPrefix = useMemo(() => {
    console.log('TokenTable-sysConfig', sysConfig);
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const dispatch: Dispatch<any> = useDispatch();
  const getSysConfig = useCallback(async () => {
    const padoServicePortListener = async function (message: any) {
      if (message.resMethodName === 'getSysConfig') {
        console.log('page_get:getSysConfig:', message.res);
        const configMap = message.res.reduce((prev: any, curr: any) => {
          const { configName, configValue } = curr;
          prev[configName] = configValue;
          return prev;
        }, {});
        dispatch(setSysConfigAction(configMap));
      }
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);
    postMsg(padoServicePort, {
      fullScreenType: 'padoService',
      reqMethodName: 'getSysConfig',
    });
    console.log('page_send:getSysConfig request', padoServicePort);
  }, [dispatch, padoServicePort]);
  useEffect(() => {
    if (!sysConfig.TOKEN_LOGO_PREFIX) {
      getSysConfig();
    }
  }, [sysConfig]);
  const currentList = useMemo(() => {
    if (filterAccount === undefined || filterAccount === 'All') {
      return list;
    }
    if (filterAccount === 'Spot') {
      return Object.values(spotAccountTokenMap);
    }
    if (filterAccount === 'Flexible') {
      return Object.values(flexibleAccountTokenMap);
    }
  }, [list, flexibleAccountTokenMap, spotAccountTokenMap, filterAccount]);
  const activeList = useMemo(() => {
    return (currentList as TokenMap[]).sort((a, b) =>
      sub(Number(b.value), Number(a.value)).toNumber()
    );
  }, [currentList]);

  const handleCheckDetail = (symbol: string) => {
    const activeS = symbol === activeItem ? undefined : symbol;
    setActiveItem(activeS);
  };
  const liClassName = useCallback(
    (item: TokenMap) => {
      let cN = 'tokenItem tr';
      if (name === 'binance') {
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
    [name, activeItem, spotAccountTokenMap, flexibleAccountTokenMap]
  );
  
  const handleChangeFilter = (filterAccount: string | undefined) => {
    setFilterAccount(filterAccount);
    setActiveItem(undefined);
  };
  return (
    <section className="tokenListWrapper assets">
      <header>
        <span>Profile</span>
      </header>
      <ul className="tokens">
        <li
          className={name === 'binance' ? 'tokenItem th new' : 'tokenItem th'}
          key="th"
        >
          <div className="innerWrapper">
            <div className="token">Token</div>
            <div className="price">Price</div>
            <div className="amount">Amount</div>
            <div className="value">USD Value</div>
          </div>
          {name === 'binance' && (
            <div className="accountFilterWrapper">
              <PFilter onChange={handleChangeFilter} />
            </div>
          )}
        </li>
        {(activeList as TokenMap[]).length > 0 ? (
          (activeList as TokenMap[]).map((item) => {
            return (
              <li className={liClassName(item)} key={item.symbol}>
                <div className="innerWrapper">
                  <div className="token">
                    {tokenLogoPrefix && (
                      <img
                        src={`${tokenLogoPrefix}icon${item.symbol}.png`}
                        alt=""
                      />
                    )}
                    <span>{item.symbol}</span>
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
              You don’t have any assets in {filterAccount === 'Flexible' ? 'flexible' : 'spot'} account.
            </h2>
          </li>
        )}
      </ul>
    </section>
  );
};

export default TokenTable;
