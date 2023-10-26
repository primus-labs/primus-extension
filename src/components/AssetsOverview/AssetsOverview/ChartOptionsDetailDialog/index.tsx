import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import PMask from '@/components/PMask';
import PHeader from '@/components/Layout/PHeader';
import iconChecked from '@/assets/img/iconChecked.svg';
import iconSuc from '@/assets/img/iconSuc.svg';

import './index.scss';
import BigNumber from 'bignumber.js';
import { add, mul, div, gt, sub } from '@/utils/utils';
import { DATASOURCEMAP } from '@/config/constants';
import type { UserState } from '@/types/store';
type ChartDataType = {
  value: string;
  name: string;
};
interface SetSucDialogProps {
  onClose: () => void;
  list: ChartDataType[];
  type: string;
}

const ChartOptionsDetailDialog: React.FC<SetSucDialogProps> = memo(
  ({ onClose, list,type }) => {
    console.log('ChartOptionsDetailDialog', list);
    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const tokenLogoPrefix = useMemo(() => {
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    
    const totalVal = useMemo(() => {
      const reduceF = (prev: BigNumber, curr: ChartDataType) => {
        const { value } = curr;
        return add(prev.toNumber(), Number(value));
      };
      const totalBal = list.reduce(reduceF, new BigNumber(0));
      return totalBal;
    }, [list]);
    const formatPercent = useCallback(
      (val: any) => {
        const percent =
          mul(Number(div(Number(val), Number(totalVal))), 100).toFixed(2) + '%';
        return percent;
      },
      [totalVal]
    );
    const getIcon = useCallback(
      (name: string) => {
        if (type === 'Token') {
          return `${tokenLogoPrefix}icon${name}.png`;
        } else {
          if (name.startsWith('0x')) {
            return DATASOURCEMAP['onChain'].icon;
          } else {
            const lowerCaseName = name.toLocaleLowerCase();
            return DATASOURCEMAP[lowerCaseName].icon;
          }
        }
      },
      [type, tokenLogoPrefix]
    );
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog ChartOptionsDetailDialog">
          <main>
            <header>
              <h1>{type} Details</h1>
            </header>
            <div className="formContent">
              <ul className="descItems tableHeader">
                <li className="descItem th">
                  <div className="token">Token</div>
                  <div className="value">Value</div>
                  <div className="ratio">Ratio</div>
                </li>
              </ul>
              <ul className="descItems tableCon">
                {list.map((i: any) => {
                  return (
                    <li className="descItem tr" key={i.name}>
                      <div className="token">
                        <img src={getIcon(i.name)} alt="" />
                        <span>{i.name}</span>
                      </div>
                      <div className="value">${i.value}</div>
                      <div className="ratio">{formatPercent(i.value)} </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </main>
        </div>
      </PMask>
    );
  }
);

export default ChartOptionsDetailDialog;
