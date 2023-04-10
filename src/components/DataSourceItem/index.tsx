import React, { useEffect, useState, useMemo } from 'react';
import BigNumber from 'bignumber.js'
import { gt } from '@/utils/utils';
import type { ExchangeMeta } from '@/utils/constants';
import './index.sass';

export type TokenMap = {
  symbol: string;
  price: string;
  amount: string;
  value: string;
}
export type AssetsMap = {
  [propName: string]: TokenMap
}
export type DataSourceData = {
  tokenListMap?: AssetsMap;
  totalBalance?: string,// TODO format amount
  assetsNo?: number,
};
export type SocialDataSourceData = {
  followers?: number | string;
  posts?: number | string;// TODO format amount
  followings?: number | string;
  verified?: boolean;
};
export type DataSourceItemType = {
  date: string,
  pnlAmount?: string,
  pnlPercent?: string,
  pnl?: string; // TODO format amount
} & ExchangeMeta & DataSourceData & SocialDataSourceData;
type SourceDescItem = {
  name: string;
  sourceKey: string;
};
interface DataSourceItemProps {
  item: DataSourceItemType,
  onCheck: (item: DataSourceItemType) => void
}

const DataSourceItem: React.FC<DataSourceItemProps> = ({ item: source, onCheck }) => {
  const { icon, name, type, date, totalBalance, assetsNo, pnlAmount, } = source;
  const formatSource = {
    ...source,
    totalBalance: totalBalance ? `$${new BigNumber(totalBalance).toFixed(2)}` : '-',
    pnlAmount: pnlAmount ? (gt(Number(pnlAmount), 0) ? `+$${new BigNumber(pnlAmount).toFixed(2)}` : `-$${new BigNumber(pnlAmount).abs().toFixed(2)}`) : '-'
  }
  const descArr: SourceDescItem[] = useMemo(() => {
    const descTypeMap = {
      Social: [
        {
          name: 'Total Followers',
          sourceKey: 'followers',
        },
        {
          name: 'Total Tweets',
          sourceKey: 'posts',
        },
        {
          name: 'Total Likes',
          sourceKey: 'followings',
        },
      ],
      Assets: [
        {
          name: 'Total Balance',
          sourceKey: 'totalBalance',
        },
        {
          name: 'PnL',
          sourceKey: 'pnlAmount',
        },
        {
          name: 'Assets No.',
          sourceKey: 'assetsNo',
        },
      ]
    };
    return descTypeMap[type]
  }, [type]);
  const handleClick = () => {
    if (type === 'Social') {
      return
    }
    onCheck(source)
  }
  return (
    <div className={type === 'Social' ? "dataSourceItem deactive" : "dataSourceItem"} onClick={handleClick}>
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
