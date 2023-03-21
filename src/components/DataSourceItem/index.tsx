import React, { useEffect, useState, useMemo } from 'react';
import './index.sass';


export type DataSource = {
  icon: any;
  name: string;
  type: 'Social' | 'Assets';
  date: string;
  commits?: number;
  followers?: number;
  totalViews?: number;
  totalBalance?: string; // TODO format amount
  assetsNo?: number;
  pnl?: string; // TODO format amount
};
type SourceDescItem = {
  name: string;
  sourceKey: string;
};

const DataSourceItem: React.FC<DataSource> = (source) => {
  const { icon, name, type, date, commits, followers, totalViews } = source;
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
          sourceKey: 'pnl',
        },
      ]
    };
    return descTypeMap[type]
  }, [type]);

  return (
    <div className="dataSourceItem">
      <div className="tag">{type}</div>
      <div className="dataSourceItemT">
        <img src={icon} alt="" />
        <div className="titleWrapper">
          <h6>{name}</h6>
          <div className="dateWrapper">{date}</div>
        </div>
      </div>
      <div className="dataSourceItemC">
        {descArr.map((item) => {
          return (
            <div key="item" className="descItem">
              <div className="descT">{item.name}</div>
              <div className="descC">
                {source[item.sourceKey as keyof typeof source]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataSourceItem;
