import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';

import logo from '@/assets/img/logo.svg';
import PAvatar from '@/components/PAvatar';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import iconWallet from '@/assets/img/layout/iconWallet.svg';
import Setting from '@/components/Setting/Setting';
import iconMy from '@/assets/img/iconMy.svg';
import iconSetting from '@/assets/img/iconSetting.svg';
import iconLock from '@/assets/img/iconLock.svg';
import PConnect from '@/components/PConnect';
import PDropdownList from '@/components/PDropdownList';

import { setConnectWalletActionAsync } from '@/store/actions';
import { debounce, throttle } from '@/utils/utils';
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
  {
    icon: iconWallet,
    text: 'Disconnect',
  },
];
const PageHeader = memo(() => {
  const [isScroll, setIsScroll] = useState(false);
  const dispatch: React.Dispatch<any> = useDispatch();
  const navigate = useNavigate();
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);
  const [settingDialogVisible, setSettingDialogVisible] =
    useState<boolean>(false);
  const userPassword = useSelector((state: UserState) => state.userPassword);
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
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
        break;
      case 'My':
        break;
      case 'Lock Account':
        navigate('/lock');
        break;
      case 'Setting':
        setSettingDialogVisible(true);
        break;
      case 'Disconnect':
        dispatch(setConnectWalletActionAsync(undefined));
        break;
    }
    setDorpdownVisible(false);
  };
  const onCloseSettingDialog = useCallback(() => {
    setSettingDialogVisible(false);
  }, []);

  const location = useLocation();
  const pathname = location.pathname;
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
  );
  const pageHeaderWrapperClassName = useMemo(() => {
    let activeClassName = 'pageHeaderWrapper';
    if (isScroll) {
      activeClassName += ' scroll';
    }
    return activeClassName;
  }, [isScroll]);
  const formatNavs = useMemo(() => {
    let arr: NavItem[] = [];
    if (userPassword) {
      arr.push(
        {
          icon: iconSetting,
          text: 'Setting',
        },
        {
          icon: iconLock,
          text: 'Lock Account',
        }
      );
    }
    if (connectedWallet?.address) {
      arr.push({
        icon: iconWallet,
        text: 'Disconnect',
      });
    }
    return arr;
  }, [userPassword, connectedWallet]);
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
      // var bodyHeight = document.body.offsetHeight;
      // var docHeight = document.documentElement.scrollHeight;
      if (topScroll >= 32) {
        setIsScroll(true);
      } else {
        setIsScroll(false);
      }
    };
    // const tFn = debounce(fn, 500);
    const tFn = throttle(fn, 500);

    window.addEventListener('scroll', tFn);
    return () => {
      window.removeEventListener('scroll', tFn);
    };
  }, [activeSourceType, pathname]);
  useEffect(() => {
    connectWalletDialogVisible && setDorpdownVisible(false);
  }, [connectWalletDialogVisible]);

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
              {/* <PAvatar /> */}
              <div className="iconMyWrapper">
                <img src={iconMy} alt="" className="iconMy" />
              </div>
              <PConnect />
            </div>
            {dorpdownVisible &&
              (!!userPassword || !!connectedWallet?.address) && (
                <div
                  className="dropdownWrapper"
                  onMouseEnter={handleEnterAvatar}
                  onMouseLeave={handleLeaveAvatar}
                >
                  <PDropdownList
                    list={formatNavs}
                    onClick={handleClickDropdownItem}
                  />
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
