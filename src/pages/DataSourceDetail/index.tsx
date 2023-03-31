import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux'
import PageHeader from '@/components/PageHeader'
import PTabs from '@/components/PTabs'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import AssetsDetail from '@/components/AssetsDetail'
import './index.sass';

const DataSourceDetail = () => {
  const handleChangeTab = () => {
  }

  return (
    <div className="appPage appHome pageDataSourceOverview">
      <div className="baseLayer overviewLayer">
        <BackgroundAnimation />
      </div>
      <div className="pageLayer">
        <PageHeader />
        <main className="appContent">
          <PTabs onChange={handleChangeTab} />
          <AssetsDetail />
          {/* list={dataSourceList} */}
        </main>
      </div>

    </div>
  );
};


export default connect(({ padoServicePort, binance }) => ({ padoServicePort, binance }), {})(DataSourceDetail);
