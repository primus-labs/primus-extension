import React, { memo, useEffect, useCallback } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useSelector, } from 'react-redux';
import rem from '@/utils/rem.js';
import type { UserState } from '@/types/store';


import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

import './index.scss';

const Nav: React.FC = memo(({ }) => {
  const theme = useSelector((state: UserState) => state.theme);
  console.log('theme', theme)
  useEffect(() => {
    rem();
  }, []);
  return (
    <div className={`PageLayout ${theme}`}>
      <Sidebar />
      <article className="pageRight">
        <Header />
        <div className="page">
          <Outlet />
        </div>

        <Footer />
      </article>
    </div>
  );
});

export default Nav;
