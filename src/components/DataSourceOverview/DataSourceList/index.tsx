import React, { memo } from 'react';

import DataSourceItem from './DataSourceItem';
import EmptyDataSourceItem from './EmptyDataSourceItem';

import type { DataSourceItemType } from './DataSourceItem';
import type {
  // SocialDataList,
  // ExDataList,
  SourceDataList,
  SourceData,
} from '@/types/dataSource';
import './index.sass';

export type DataSourceItemList = DataSourceItemType[];

interface DataSourceItemProps {
  onAdd: () => void;
  // list: DataSourceItemList;
  list: SourceDataList;
  onCheck: (item: SourceData) => void;
}

const DataSourceList: React.FC<DataSourceItemProps> = memo(
  ({ onAdd, onCheck, list = [] }) => {
    const handleAdd = () => {
      onAdd();
    };
    return (
      <div className="dataSourceList">
        {list.length < 1 && <EmptyDataSourceItem onAdd={handleAdd} />}
        {list.map((item,k) => {
          return (
            <DataSourceItem key={k} item={item} onCheck={onCheck} />
          );
        })}
      </div>
    );
  }
);

export default DataSourceList;
