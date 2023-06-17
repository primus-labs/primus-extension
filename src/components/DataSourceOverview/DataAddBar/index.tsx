import React, { memo } from 'react';
import './index.sass';
interface DataAddBarProps {
  onClick: () => void;
}
const DataAddBar: React.FC<DataAddBarProps> = memo(({ onClick }) => {
  return (
    <div className="dataAddBar">
      <button className="updateBtn" onClick={onClick}>
        <div className="imgUpdate"></div>
        <span>Add Data</span>
      </button>
    </div>
  );
});

export default DataAddBar;
