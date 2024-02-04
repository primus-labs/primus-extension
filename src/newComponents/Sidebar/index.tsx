import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { UserState } from '@/types/store';

import Nav from '../Nav';
import logo from '@/assets/img/logo.svg';
import logoForDark from '@/assets/newImg/layout/logoForDark.svg';
import './index.scss';

interface PButtonProps {}

const Sidebar: React.FC<PButtonProps> = memo(({ }) => {
  const theme = useSelector((state: UserState) => state.theme);
  console.log('theme', theme)
  const formatLogo = useMemo(() => {
    return theme === 'light' ? logo : logoForDark;
  }, [theme]);
  return (
    <div className="sidebar">
      <div className="logoWrapper">
        <img src={formatLogo} alt="" className="logo" />
      </div>
      <Nav />
    </div>
  );
});

export default Sidebar;
