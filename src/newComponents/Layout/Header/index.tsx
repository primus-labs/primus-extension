import React, { memo, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { list } from '@/config/menu';
import PButton from '@/newComponents/PButton';
import PConnect from '@/newComponents/PConnect';

import iconAvatar from '@/assets/newImg/layout/iconAvatar.svg';
import './index.scss';

const Nav: React.FC = memo(({}) => {
  const location = useLocation();
  
  const { pathname } = location;
  console.log('location', location, pathname, list);
  // const handleConnect = useCallback(() => {}, []);
  const pathTitle = useMemo(() => {
    const obj = list.find(
      (i) =>
        i.link === pathname ||
        (i.link !== '/' && pathname.startsWith(i.link as string))
    );
    return obj?.label;
  }, [pathname]);
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
          <img src={iconAvatar} alt="" />
        </div>
      </div>
    </div>
  );
});

export default Nav;
