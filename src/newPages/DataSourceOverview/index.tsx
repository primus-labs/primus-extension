import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import DataSourceCards from '@/newComponents/DataSource/DataSourceCards';
import Search from '@/newComponents/DataSource/Search';
import Banner from '@/newComponents/DataSource/Banner';
import './index.scss';

const DataSourceOverview = memo(() => {
  // useCheckIsConnectedWallet(true);
  return (
    <div className="pageDataSource">
      <div className="pageContent">
        <Banner />
        <Search />
        <DataSourceCards />
      </div>
    </div>
  );
});

export default DataSourceOverview;
