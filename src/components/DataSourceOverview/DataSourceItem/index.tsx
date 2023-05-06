import React, { useEffect, useState, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { gte, formatNumeral } from '@/utils/utils';
import type { ExchangeMeta } from '@/utils/constants';

import iconSuc from '@/assets/img/iconSuc.svg';
import './index.sass';

export type TokenMap = {
  symbol: string;
  price: string;
  amount: string;
  value: string;
};
export type AssetsMap = {
  [propName: string]: TokenMap;
};
export type DataSourceData = {
  tokenListMap?: AssetsMap;
  totalBalance?: string;
  assetsNo?: number;
  label?: string;
  flexibleAccountTokenMap?: any;
  spotAccountTokenMap?: any;
};
export type SocialDataSourceData = {
  followers?: number | string;
  posts?: number | string; // TODO format amount
  followings?: number | string;
  verified?: boolean;
  userName?: string;
  createdTime?: string;
};
export type DataSourceItemType = {
  date: string;
  pnlAmount?: string;
  pnlPercent?: string;
  pnl?: string; // TODO format amount
} & ExchangeMeta &
  DataSourceData &
  SocialDataSourceData;
type SourceDescItem = {
  name: string;
  sourceKey: string;
};
interface DataSourceItemProps {
  item: DataSourceItemType;
  onCheck: (item: DataSourceItemType) => void;
}

const DataSourceItem: React.FC<DataSourceItemProps> = ({
  item: source,
  onCheck,
}) => {
  const {
    icon,
    name,
    type,
    date,
    totalBalance,
    pnl,
    followers,
    posts,
    followings,
    label,
    userName,
  } = source;
  const formatSource = {
    ...source,
    totalBalance: totalBalance ? `$${formatNumeral(totalBalance)}` : '--',
    pnlAmount: pnl
      ? gte(Number(pnl), 0)
        ? `+$${formatNumeral(pnl, { decimalPlaces: 4 })}`
        : `-$${formatNumeral(new BigNumber(Number(pnl)).abs().toFixed(), {
            decimalPlaces: 4,
          })}`
      : '--',
    followers:
      followers &&
      `${formatNumeral(followers, { transferUnit: false, decimalPlaces: 0 })}`,
    posts:
      posts &&
      `${formatNumeral(posts, { transferUnit: false, decimalPlaces: 0 })}`,
    followings:
      followings &&
      `${formatNumeral(followings, { transferUnit: false, decimalPlaces: 0 })}`,
  };
  const descArr: SourceDescItem[] = useMemo(() => {
    const descTypeMap = {
      Social: [
        {
          name: 'Total Followers',
          sourceKey: 'followers',
        },
        {
          name: 'Total Following',
          sourceKey: 'followings',
        },
        {
          name: 'Total Posts',
          sourceKey: 'posts',
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
      ],
    };
    return descTypeMap[type];
  }, [type]);
  const handleClick = () => {
    if (type === 'Social') {
      return;
    }
    onCheck(source);
  };
  const activeClassName = useMemo(() => {
    let defalutClass = 'dataSourceItem';
    if (type === 'Social') {
      defalutClass += ' deactive';
    }
    return defalutClass;
  }, [type]);
  return (
    <div className={activeClassName} onClick={handleClick}>
      <div className="dataSourceItemT">
        <div className={(type === 'Assets' && label) ?'TLeft':"TLeft noLabel"}>
          <img src={icon} alt="" />
          <div className="TLeftCon">
            <h6>{name}</h6>
            {type === 'Social' && (
              <div className="desc">
                <span className="label">Name:&nbsp;</span>
                <span className="value">{userName ?? '--'}</span>
              </div>
            )}
            {type === 'Assets' && label && (
              <div className="desc">
                <span className="label">Label:&nbsp;</span>
                <span className="value">{label}</span>
              </div>
            )}
          </div>
        </div>
        <div className="TRight titleWrapper">
          <div className="dateWrapper">
            <img src={iconSuc} alt="" />
            <span>{date}</span>
          </div>
          <div className={type === 'Social' ? 'tag social' : 'tag'}>{type}</div>
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
