import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useSelector } from 'react-redux';

import logo from '@/assets/img/logo.svg';
import PAvatar from '@/components/PAvatar';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import Setting from '@/components/Setting/Setting';
import iconMy from '@/assets/img/iconMy.svg';
import iconSetting from '@/assets/img/iconSetting.svg';
import iconLock from '@/assets/img/iconLock.svg';

import { throttle } from '@/utils/utils';
import type { UserState } from '@/types/store';
import './index.sass';

type NavItem = {
  icon: any;
  text: string;
};

const navs: NavItem[] = [
  // {
  //   icon: iconMy,
  //   text: 'My',
  // },
  {
    icon: iconSetting,
    text: 'Setting',
  },
  {
    icon: iconLock,
    text: 'Lock Account',
  },
];
const PageHeader = memo(() => {
  // console.log('222222PageHeader');
  const [isScroll, setIsScroll] = useState(false);

  const navigate = useNavigate();
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);
  const [settingDialogVisible, setSettingDialogVisible] =
    useState<boolean>(false);
  const handleClickAvatar = () => {
    setDorpdownVisible((visible) => !visible);
  };
  const handleEnterAvatar = () => {
    setDorpdownVisible(true);
  };
  const handleLeaveAvatar = () => {
    setDorpdownVisible(false);
  };

  const handleClickDropdownItem = (text: string) => {
    switch (text) {
      case 'Logout':
        // navigate('/')
        break;
      case 'My':
        // navigate('/my')
        break;
      case 'Lock Account':
        navigate('/lock');
        break;
      case 'Setting':
        setSettingDialogVisible(true);
        break;
    }
  };
  const onCloseSettingDialog = useCallback(() => {
    setSettingDialogVisible(false);
  }, []);

  const location = useLocation();
  const pathname = location.pathname;
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const pageHeaderWrapperClassName = useMemo(() => {
    let activeClassName = 'pageHeaderWrapper aaa';
    if (isScroll) {
      activeClassName += ' scroll';
    }
    return activeClassName;
  }, [isScroll]);
  useEffect(() => {
    if (activeSourceType !== 'All') {
      setIsScroll(false);
      if (document.documentElement.scrollTop > 0) {
        document.documentElement.scrollTo({
          top: 0,
          // behavior: 'smooth',
        });
      }
    }
  }, [activeSourceType]);
  useEffect(() => {
    const fn = () => {
      if (activeSourceType !== 'All' || pathname !== '/datas') {
        setIsScroll(false);
        return;
      }
      var topScroll = document.documentElement.scrollTop || window.pageYOffset;
      if (topScroll >= 1) {
        setIsScroll(true);
      } else {
        setIsScroll(false);
      }
    }
    window.addEventListener('scroll', fn);
    return () => {
      window.removeEventListener('scroll', fn);
    };
  }, [activeSourceType, pathname]);

  return (
    <div className={pageHeaderWrapperClassName}>
      <header className="pageHeader">
        <div className="pageHeaderInner">
          <img src={logo} className="pLogo" alt="" />
          <DataSourceSearch />
          <div className="rightHeader">
            <div
              className="rightHeaderInner"
              onClick={handleClickAvatar}
              onMouseEnter={handleEnterAvatar}
              onMouseLeave={handleLeaveAvatar}
            >
              <PAvatar />
            </div>
            {dorpdownVisible && (
              <div
                className="dropdownWrapper"
                onMouseEnter={handleEnterAvatar}
                onMouseLeave={handleLeaveAvatar}
              >
                <ul className="dropdown">
                  {navs.map((item) => {
                    return (
                      <li
                        key={item.text}
                        className="dropdownItemWrapper"
                        onClick={() => {
                          handleClickDropdownItem(item.text);
                        }}
                      >
                        <div className="dropdownItem">
                          <img src={item.icon} alt="" />
                          <span>{item.text}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
        {settingDialogVisible && <Setting onClose={onCloseSettingDialog} />}
      </header>
    </div>
  );
});

export default PageHeader;
