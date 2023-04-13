import React, { useState, useEffect, useMemo } from 'react';
import { connect, useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import PHeader from '@/components/PHeader';
import PageHeader from '@/components/PageHeader';
import BackgroundAnimation from '@/components/BackgroundAnimation'
import './index.sass'

const Layout = () => {
  const location = useLocation()
  console.log('Layout', location.pathname)
  return (
    <div className="pageApp">
      <BackgroundAnimation />
      <div className="pageLayer">
        <header className="appHeader">
          {location.pathname === '/' ? <PHeader /> : <PageHeader />}
        </header>
        <main className="appContent">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


export default Layout
