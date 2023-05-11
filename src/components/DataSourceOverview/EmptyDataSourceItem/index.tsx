import React from 'react';
import iconAdd from '@/assets/img/iconAdd.svg'
import './index.sass';

interface DataSourceItemProps {
  onAdd: () => void
}
const DataSourceItem: React.FC<DataSourceItemProps> = ({ onAdd }) => {
  const handleClickAdd = () => {
    onAdd()
  }
  return (
    <div className="emptyDataSourceItem" onClick={handleClickAdd}>
      <div className="emptyDataSourceItemC">
        <img src={iconAdd} alt="" />
        <span>Add</span>
      </div>
    </div>
  );
};

export default DataSourceItem;
