import React, { memo, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { list } from '@/config/menu';
import PButton from '@/newComponents/PButton';
import PConnect from '@/newComponents/PConnect';

import iconMy from '@/assets/img/iconMy.svg';
import './index.scss';

const Nav: React.FC = memo(({}) => {
  const location = useLocation();
  console.log('location', location);
  const { pathname } = location;
  // const handleConnect = useCallback(() => {}, []);
  const pathTitle = useMemo(() => {
    const obj = list.find((i) => i.link === pathname);
    return obj?.label;
  }, []);
  return (
    <div className="pageHeader">
      <div className="pathName">{pathTitle}</div>
      <div className="rightActions">
        <i className="iconfont icon-iconBell"></i>
        {/* <PButton
          className="connectBtn"
          text="Connect wallet"
          onClick={handleConnect}
        /> */}
        <PConnect/>
        <div className="avatar">
          <img src={iconMy} alt="" />
        </div>
      </div>
    </div>
  );
});

export default Nav;
