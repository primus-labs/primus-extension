import React, { memo, useCallback, useState, useMemo, FC } from 'react';
import { useSelector } from 'react-redux';
import { Pagination } from 'antd';
import { sub, formatNumeral } from '@/utils/utils';
import './index.scss';
const PAGESIZE = 10;
interface TokenTableProps {
  title: string;
  id: string;
  listMap: any;
  others?: any;
}

const TokenTable: FC<TokenTableProps> = memo(
  ({ title = 'Tokens', id, listMap, others = {} }) => {
    const { spotAccountTokenMap, flexibleAccountTokenMap } = others;
    const totolCount = Object.values(listMap).length;
    const [current, setCurrent] = useState(1);
    const sysConfig = useSelector((state) => state.sysConfig);
    const tokenLogoPrefix = useMemo(() => {
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    const showTokenListFn = useCallback(() => {
      const l = Object.values(listMap);
      const sortFn = (l) => {
        return l.sort((a: any, b: any) =>
          sub(Number(b.value), Number(a.value)).toNumber()
        );
      };
      const sortedL = sortFn(l);
      const startK = (current - 1) * PAGESIZE;
      let newL = sortedL.slice(startK, startK + PAGESIZE);
      return newL;
    }, [current]);
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
          <div className="num">({Object.keys(listMap).length})</div>
        </div>
        <ul className="tokenItems">
          <li className="tokenItem th">
            <div className="token">Token</div>
            {!!spotAccountTokenMap && (
              <>
                <div className="fixed">Spot</div>
                <div className="flexible">Flexible</div>
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
                  <img src={iconFn(j)} alt="" />
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
        <div className={'pageComponent'}>
          <Pagination
            total={totolCount}
            onChange={pageChangedFn}
            showSizeChanger={false}
            pageSize={PAGESIZE}
          />
        </div>
      </div>
    );
  }
);

export default TokenTable;
