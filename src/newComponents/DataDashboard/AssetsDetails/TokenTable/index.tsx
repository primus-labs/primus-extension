import React, { memo, useCallback, useState, useMemo, FC } from 'react';
import { useSelector } from 'react-redux';
import { Pagination } from 'antd';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import { sub, formatNumeral } from '@/utils/utils';
import './index.scss';
import idex from 'ccxt/js/src/pro/idex';
const PAGESIZE = 10;
interface TokenTableProps {
  title: string;
  id: string;
  listMap: any;
  others?: any;
}

const TokenTable: FC<TokenTableProps> = memo(
  ({ title = 'Tokens', id, listMap, others = {} }) => {
    const { tokenIconFn } = useAssetsStatistic();
    const { spotAccountTokenMap, flexibleAccountTokenMap } = others;
    const totolCount = listMap.length;
    const [current, setCurrent] = useState(1);
    const sysConfig = useSelector((state) => state.sysConfig);
    const tokenLogoPrefix = useMemo(() => {
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    const showTokenListFn = useCallback(() => {
      const startK = (current - 1) * PAGESIZE;
      let newL = listMap.slice(startK, startK + PAGESIZE);
      return newL;
    }, [current, listMap]);
  

    const pageChangedFn = (page) => {
      if (page === 'pre') {
        page = current - 1;
      }
      if (page === 'next') {
        page = current + 1;
      }
      if (page < 1) {
        page = 1;
      }
      setCurrent(page);
    };

    return (
      <div className="tokenTable">
        <div className="title">
          <span>{title}</span>
          <div className="num">({totolCount})</div>
        </div>
        <ul className={`tokenItems ${totolCount >= 10 ? 'fullHeight' : ''}`}>
          <li className="tokenItem th">
            <div className="token">
              {title === 'Portfolio' ? 'Portfolio' : 'Token'}
            </div>
            {!!spotAccountTokenMap && (
              <>
                <div className="fixed">Spot</div>
                <div className="flexible">Earn</div>
              </>
            )}
            <div className="totalAmount">Total Amount</div>
            <div className="price">Price</div>
            <div className="totalValue">Total Value</div>
          </li>
          {showTokenListFn().map((j: any) => {
            return (
              <li className="tokenItem tr" key={j.symbol}>
                <div className="token">
                  <img src={tokenIconFn(j, id)} alt="" />
                  <span>{j.symbol.split('---')[0]}</span>
                </div>
                {!!spotAccountTokenMap && (
                  <>
                    <div className="fixed">
                      {formatNumeral(
                        spotAccountTokenMap[j.symbol]?.amount ?? 0,
                        { decimalPlaces: 6 }
                      )}
                    </div>
                    <div className="flexible">
                      {formatNumeral(
                        flexibleAccountTokenMap[j.symbol]?.amount ?? 0,
                        { decimalPlaces: 6 }
                      )}
                    </div>
                  </>
                )}
                <div className="totalAmount">
                  {formatNumeral(j.amount, {
                    decimalPlaces: 6,
                  })}
                </div>
                <div className="price">${formatNumeral(j.price)}</div>
                <div className="totalValue">${formatNumeral(j.value)}</div>
              </li>
            );
          })}
        </ul>
        {totolCount > 10 && (
          <div className={'pageComponent'}>
            <Pagination
              total={totolCount}
              onChange={pageChangedFn}
              showSizeChanger={false}
              pageSize={PAGESIZE}
            />
          </div>
        )}
      </div>
    );
  }
);

export default TokenTable;
