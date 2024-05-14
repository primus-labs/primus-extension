import React, { memo, useMemo, FC } from 'react';
import BigNumber from 'bignumber.js';
import { sub, add, div, mul, gt, formatNumeral } from '@/utils/utils';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import './index.scss';

const MAXSHOWTOKENLEN = 5;
const TokenPie: FC = memo(() => {
  const { sortedHoldingTokensList, balancePercentFn, tokenIconFn } =
    useAssetsStatistic();
  const showTokenList = useMemo(() => {
    const allTokenList = sortedHoldingTokensList.map((i) => {
      const { symbol, value, logo } = i;
      return {
        symbol,
        value,
      };
    });
    if (allTokenList.length > MAXSHOWTOKENLEN) {
      const prevL = allTokenList.slice(0, MAXSHOWTOKENLEN - 1);
      const otherL = allTokenList.slice(MAXSHOWTOKENLEN - 1);
      const reduceF: (prev: BigNumber, curr: any) => BigNumber = (
        prev,
        curr
      ) => {
        const { value: totalBalance } = curr;
        return add(prev.toNumber(), Number(totalBalance));
      };
      let otherTotalBal = otherL.reduce(reduceF, new BigNumber(0));
      otherTotalBal = `${otherTotalBal.toFixed(2)}`;

      return [...prevL, { symbol: 'Other', value: otherTotalBal }];
    } else {
      return allTokenList;
    }
  }, [sortedHoldingTokensList]);
  return (
    <div className="tokenPie">
      <ul className={`tokenItems tokenItems${showTokenList.length}`}>
        {showTokenList.map((i, index) => {
          return (
            <li className="tokenItem" key={index}>
              <div className="symbol">
                {i.symbol !== 'Other' && <img src={tokenIconFn(i)} alt="" />}
                <span>{i.symbol.split('---')[0]}</span>
              </div>
              <div className="balance">${formatNumeral(i.value)}</div>
              <div className="percent">{balancePercentFn(i)}%</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
export default TokenPie;
