import React, { useEffect, useState, useMemo } from 'react';
import BigNumber from 'bignumber.js'
import { gt } from '@/utils/utils';
import './index.sass';


export type DataSourceItemType = {
  icon: any,
  name: string,
  type: 'Social' | 'Assets';
  date: string,
  totalBalance: string, // TODO format amount
  assetsNo: number,
  pnlAmount?: string,
  pnlPercent?: string,
  commits?: number;
  followers?: number;
  totalViews?: number;
  pnl?: string; // TODO format amount
};
type SourceDescItem = {
  name: string;
  sourceKey: string;
};
interface DataSourceItemProps {
  item: DataSourceItemType
}

const DataSourceItem: React.FC<DataSourceItemProps> = ({ item: source }) => {
  const { icon, name, type, date, totalBalance, assetsNo, pnlAmount, commits, followers, totalViews } = source;
  const formatSource = {
    ...source,
    totalBalance: totalBalance ? `$${new BigNumber(totalBalance).toFixed(2)}` : '-',
    pnlAmount: pnlAmount ? (gt(Number(pnlAmount), 0) ? `+$${new BigNumber(pnlAmount).toFixed(2)}` : `-$${new BigNumber(pnlAmount).abs().toFixed(2)}`) : '-'
  }
  const descArr: SourceDescItem[] = useMemo(() => {
    const descTypeMap = {
      Social: [
        {
          name: 'Commits',
          sourceKey: 'commits',
        },
        {
          name: 'Followers',
          sourceKey: 'followers',
        },
        {
          name: 'Total Views',
          sourceKey: 'totalViews',
        },
      ],
      Assets: [
        {
          name: 'Total Balance',
          sourceKey: 'totalBalance',
        },
        {
          name: 'Assets No.',
          sourceKey: 'assetsNo',
        },
        {
          name: 'PnL',
          sourceKey: 'pnlAmount',
        },
      ]
    };
    return descTypeMap[type]
  }, [type]);

  return (
    <div className="dataSourceItem">
      <div className="dataSourceItemT">
        <div className="TLeft">
          <img src={icon} alt="" />
          <h6>{name}</h6>
        </div>
        <div className="TRight titleWrapper">
          <div className="dateWrapper">{date}</div>
          <div className="tag">{type}</div>
        </div>
      </div>
      <div className="dataSourceItemC">
        {descArr.map((item) => {
          return (
            <div key={item.name} className="descItem">
              <div className="descT">{item.name}</div>
              <div className="descC">
                {formatSource[item.sourceKey as keyof typeof source]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataSourceItem;
