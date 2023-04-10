import React from 'react';
import DataSourceItem from '@/components/DataSourceItem'
import EmptyDataSourceItem from '@/components/EmptyDataSourceItem'
import type { DataSourceItemType } from '@/components/DataSourceItem'
import './index.sass';

export type DataSourceItemList = DataSourceItemType[]

interface DataSourceItemProps {
  onAdd: () => void;
  list: DataSourceItemList;
  onCheck: (item: DataSourceItemType) => void;
}

const DataSourceList: React.FC<DataSourceItemProps> = ({ onAdd, onCheck, list = [] }) => {
  const handleAdd = () => {
    onAdd()
  }
  return (
    <div className="dataSourceList">
      {list.length >= 5 && <EmptyDataSourceItem onAdd={handleAdd} />}
      {list.map(item => {
        return (<DataSourceItem key={item.name} item={item} onCheck={onCheck} />)
      })}
      {list.length < 5 && <EmptyDataSourceItem onAdd={handleAdd} />}
    </div>
  );
};

export default DataSourceList;
