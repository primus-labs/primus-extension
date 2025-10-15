import React, { memo, useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { menuList } from '@/config/menu';
import PConnect from '@/newComponents/PConnect';
import PPTabs from '@/newComponents/PTabs';
import Notification from '@/newComponents/Notification';

import './index.scss';
const tList = [
  { label: 'Events', value: '1', link: '/events' },
  { label: 'Rewards', value: '2', link: '/events/rewards' },
];
const Nav: React.FC = memo(({}) => {
  const location = useLocation();
  const { pathname, search } = location;
  console.log('location', location, pathname, menuList);
  const [ttt, setTtt] = useState(() => {
    return pathname === '/events/rewards' ? '2' : '1';
  });
  const tabList = useMemo(() => {
    const l = tList.map((i) => {
      const purePathName = i.link.split('?')[0];
      if (purePathName === '/events/rewards') {
        i.link = `${purePathName}${search}`;
      }
      return i;
    });
    return l;
  }, [tList, search]);

  // const handleConnect = useCallback(() => {}, []);
  const pathTitle = useMemo(() => {
    const obj = menuList.find(
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
      <div className="pageContent">
        {pathname.startsWith('/events') &&
        !['?id=LINEA_DEFI_VOYAGE', '?id=BAS_EVENT_PROOF_OF_HUMANITY'].includes(
          search
        ) ? (
          <PPTabs
            list={tabList}
            onChange={(ppp) => {
              setTtt(ppp);
            }}
            value={ttt}
          />
        ) : (
          <div className="pathName">{pathTitle}</div>
        )}
        <div className="rightActions">
          {/* <i className="iconfont icon-iconBell"></i> */}
          {/* <PButton
          className="connectBtn"
          text="Connect wallet"
          onClick={handleConnect}
        /> */}
          <Notification />
          <PConnect />
          {/* <div className="avatar">
            <img src={iconAvatar} alt="" />
          </div> */}
        </div>
      </div>
    </div>
  );
});

export default Nav;
