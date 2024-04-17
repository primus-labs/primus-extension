import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { list } from '@/config/menu';
import PButton from '@/newComponents/PButton';
import PConnect from '@/newComponents/PConnect';
import PPTabs from '@/newComponents/PTabs';

import iconAvatar from '@/assets/newImg/layout/iconAvatar.svg';
import './index.scss';
const tList = [
  { label: 'Events', value: '1', link: '/events' },
  { label: 'Rewards', value: '2', link: '/events/rewards' },
];
const Nav: React.FC = memo(({}) => {
  const location = useLocation();
  const { pathname } = location;
  console.log('location', location, pathname, list);
  const [ttt, setTtt] = useState(() => {
    return pathname === '/events/rewards' ? '2' : '1';
  });

  // const handleConnect = useCallback(() => {}, []);
  const pathTitle = useMemo(() => {
    const obj = list.find(
      (i) =>
        i.link === pathname ||
        (i.link !== '/' && pathname.startsWith(i.link as string))
    );
    return obj?.label;
  }, [pathname]);
  useEffect(() => {
    setTtt(() => {
      return pathname === '/events/rewards' ? '2' : '1';
    });
  }, [pathname]);

  return (
    <div className="pageHeader">
      {pathname.startsWith('/events') &&
      !pathname.startsWith('/events/detail') ? (
        <PPTabs
          list={tList}
          onChange={(ppp) => {
            setTtt(ppp);
          }}
          value={ttt}
        />
      ) : (
        <div className="pathName">{pathTitle}</div>
      )}

      <div className="rightActions">
        <i className="iconfont icon-iconBell"></i>
        {/* <PButton
          className="connectBtn"
          text="Connect wallet"
          onClick={handleConnect}
        /> */}
        <PConnect />
        <div className="avatar">
          <img src={iconAvatar} alt="" />
        </div>
      </div>
    </div>
  );
});

export default Nav;
