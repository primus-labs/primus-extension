import React, { memo } from 'react';
// import iconAdd from '@/assets/img/iconAdd.svg';
import './index.scss';

interface DataSourceItemProps {
  onAdd: () => void;
}
const DataSourceItem: React.FC<DataSourceItemProps> = memo(({ onAdd }) => {
  const handleClickAdd = () => {
    onAdd();
  };
  return (
    <div className="emptyDataSourceItem" onClick={handleClickAdd}>
      <div className="emptyDataSourceItemC">
        <i className="iconfont icon-iconAdd"/>
        <span>Add</span>
      </div>
    </div>
  );
});

export default DataSourceItem;
