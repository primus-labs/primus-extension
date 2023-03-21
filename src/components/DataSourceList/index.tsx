import React, { useEffect, useState } from 'react';
import DataSourceItem from '@/components/DataSourceItem'
import EmptyDataSourceItem from '@/components/EmptyDataSourceItem'
import type { DataSource } from '@/components/DataSourceItem'
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceOKX from '@/assets/img/iconDataSourceOKX.svg';

import './index.sass';

const DataSourceList = () => {
  const [sourceList, setSourceList] = useState<DataSource[]>([
    {
      icon: iconDataSourceBinance,
      name: 'Binance',
      type: 'Assets',
      date: '12 Mar, 2023',
      totalBalance: '$123456.78',
      assetsNo: 2,
      pnl: '-$0.01'
    },
    {
      icon: iconDataSourceTwitter,
      name: 'Binance',
      type: 'Social',
      date: '12 Mar, 2023',
      commits: 3000,
      followers: 208,
      totalViews: 26
    },
    {
      icon: iconDataSourceOKX,
      name: 'OKX',
      type: 'Assets',
      date: '12 Mar, 2023',
      totalBalance: '$89.78',
      assetsNo: 2,
      pnl: '-$2000.01'
    }])
  return (
    <div className="dataSourceList">
      {sourceList.length >= 10 && <EmptyDataSourceItem />}
      {sourceList.map(item => {
        return (<DataSourceItem key={item.name} {...item} />)
      })}
      {sourceList.length < 10 && <EmptyDataSourceItem />}
    </div>
  );
};

export default DataSourceList;
