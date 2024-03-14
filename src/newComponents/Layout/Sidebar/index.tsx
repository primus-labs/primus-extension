import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { UserState } from '@/types/store';

import Nav from '../../Nav';
import PSwitch from '@/newComponents/PSwitch';
import logo from '@/assets/img/logo.svg';
import logoForLight from '@/assets/newImg/layout/logoForLight.svg';
import logoForDark from '@/assets/newImg/layout/logoForDark.svg';
import './index.scss';

interface PButtonProps {}

const Sidebar: React.FC<PButtonProps> = memo(({}) => {
  const theme = useSelector((state: UserState) => state.theme);
  console.log('theme', theme);
  const formatLogo = useMemo(() => {
    return theme === 'light' ? logoForLight : logoForDark;
  }, [theme]);
  return (
    <div className="sidebar">
      <div className="sidebarTop">
        <div className="logoWrapper">
          <img src={formatLogo} alt="" className="logo" />
        </div>
        <Nav />
      </div>
      <div className="sidebarBottom">
        <PSwitch />
      </div>
    </div>
  );
});

export default Sidebar;
