import React from 'react';
import DataSourceItem from '@/components/DataSourceOverview/DataSourceItem'
import EmptyDataSourceItem from '@/components/DataSourceOverview/EmptyDataSourceItem'
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem'
import './index.sass';

export type DataSourceItemList = DataSourceItemType[]

interface DataSourceItemProps {
  onAdd: () => void;
  list: DataSourceItemList;
  onCheck: (item: DataSourceItemType) => void;
}

const DataSourceList: React.FC<DataSourceItemProps> = ({ onAdd, onCheck, list = [] }) => {
  // console.log('DataSourceList====', list)
  const handleAdd = () => {
    onAdd()
  }
  return (
    <div className="dataSourceList">
      {list.length < 1 && <EmptyDataSourceItem onAdd={handleAdd} />}
      {list.map(item => {
        return (<DataSourceItem key={item.name} item={item} onCheck={onCheck} />)
      })}
    </div>
  );
};

export default DataSourceList;
