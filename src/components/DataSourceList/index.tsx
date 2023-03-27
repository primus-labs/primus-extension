import React, { useEffect, useState } from 'react';
import DataSourceItem from '@/components/DataSourceItem'
import EmptyDataSourceItem from '@/components/EmptyDataSourceItem'

import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceOKX from '@/assets/img/iconDataSourceOKX.svg';
import type { DataSourceItemType } from '@/components/DataSourceItem'
import './index.sass';

export type DataSourceItemList = DataSourceItemType[]

interface DataSourceItemProps {
  onAdd: () => void,
  list: DataSourceItemList
}

const DataSourceList: React.FC<DataSourceItemProps> = ({ onAdd, list = [] }) => {

  // const [sourceList, setSourceList] = useState<DataSource[]>([
  //   {
  //     icon: iconDataSourceBinance,
  //     name: 'Binance',
  //     type: 'Assets',
  //     date: '12 Mar, 2023',
  //     totalBalance: '$123456.78',
  //     assetsNo: 2,
  //     pnl: '-$0.01'
  //   },
  //   {
  //     icon: iconDataSourceTwitter,
  //     name: 'KuCoin',
  //     type: 'Social',
  //     date: '12 Mar, 2023',
  //     commits: 3000,
  //     followers: 208,
  //     totalViews: 26
  //   },
  //   {
  //     icon: iconDataSourceOKX,
  //     name: 'OKX',
  //     type: 'Assets',
  //     date: '12 Mar, 2023',
  //     totalBalance: '$89.78',
  //     assetsNo: 2,
  //     pnl: '-$2000.01'
  //   }])

  const handleAdd = () => {
    onAdd()
  }
  const handleSelectItem = () => {

  }

  return (
    <div className="dataSourceList">
      {list.length >= 5 && <EmptyDataSourceItem onAdd={handleAdd} />}
      {list.map(item => {
        return (<DataSourceItem key={item.name} item={item} />)
      })}
      {list.length < 5 && <EmptyDataSourceItem onAdd={handleAdd} />}
    </div>
  );
};

export default DataSourceList;
