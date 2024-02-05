import React, { memo, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PButton from '@/newComponents/PButton';

import iconMy from '@/assets/img/iconMy.svg';
import './index.scss';

const Nav: React.FC = memo(({ }) => {
  const location = useLocation();
  console.log('location',location)
  const handleConnect = useCallback(() => {}, []);
  return (
    <div className="pageHeader">
        <div className="pathName">Data</div>
        <div className="rightActions">
          <i className="iconfont icon-iconBell"></i>
          <PButton
            className="connectBtn"
            text="Connect wallet"
            onClick={handleConnect}
          />
          <div className="avatar">
            <img src={iconMy} alt="" />
          </div>
        </div>
      </div>
    
  );
});

export default Nav;
