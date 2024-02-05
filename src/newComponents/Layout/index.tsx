import React, { memo, useMemo, useCallback } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

import iconMy from '@/assets/img/iconMy.svg';
import './index.scss';

const Nav: React.FC = memo(({}) => {
  const location = useLocation();
  console.log('location', location);
  const handleConnect = useCallback(() => {}, []);
  return (
    <div className="PageLayout">
      <Sidebar />
      <article className="pageRight">
        <Header />
        <Outlet />
        <Footer />
      </article>
    </div>
  );
});

export default Nav;
