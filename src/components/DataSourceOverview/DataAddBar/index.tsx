import React, { memo } from 'react';
import './index.sass';
import iconAddNew from '@/assets/img/iconAddNew.svg';
interface DataAddBarProps {
  onClick: () => void;
}
const DataAddBar: React.FC<DataAddBarProps> = memo(({ onClick }) => {
  return (
    <div className="dataAddBar">
      <button className="updateBtn" onClick={onClick}>
        {/* <div className="imgUpdate"></div> */}
        {/* <span>Add Data</span> */}
        <img src={iconAddNew} alt="" />
      </button>
    </div>
  );
});

export default DataAddBar;
