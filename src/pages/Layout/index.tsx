import React, { useState, useEffect, useMemo } from 'react';
import { connect, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import PHeader from '@/components/PHeader';
import BackgroundAnimation from '@/components/BackgroundAnimation'
import './index.sass'

const DataSourceOverview = () => {
  return (
    <div className="pageApp">
      <BackgroundAnimation />
      <div className="pageLayer">
        <header className="appHeader">
          <PHeader />
        </header>
        <main className="appContent">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


export default DataSourceOverview
