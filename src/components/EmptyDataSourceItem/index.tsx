import React, { useEffect, useState, useMemo } from 'react';
import iconAdd from '@/assets/img/iconAdd.svg'
import './index.sass';


const DataSourceItem = () => {
  return (
    <div className="dataSourceItem emptyDataSourceItem">
      <div className="emptyDataSourceItemC">
        <img src={iconAdd} alt="" />
        <span>Add</span>
      </div>
    </div>
  );
};

export default DataSourceItem;
