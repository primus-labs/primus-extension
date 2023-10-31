import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';

import logo from '@/assets/img/logo.svg';
import iconWallet from '@/assets/img/layout/iconWallet.svg';
import Setting from '@/components/Setting/Setting';
import iconSetting from '@/assets/img/iconSetting.svg';
import iconLock from '@/assets/img/iconLock.svg';
import iconRewards from '@/assets/img/layout/iconRewards.svg';
import PConnect from '@/components/PConnect';
import PDropdownList from '@/components/PDropdownList';
import PTabsNew from '@/components/PTabsNew';
import {
  setConnectWalletActionAsync,
  setRewardsDialogVisibleAction,
} from '@/store/actions';
import type { UserState } from '@/types/store';
import type { TabItem } from '@/components/PTabsNew';
import './index.scss';
import RewardsDialog from '@/components/RewardsDialog';
import iconDataHover from '@/assets/img/iconDataHover.svg';
import iconEventsHover from '@/assets/img/iconEventsHover.svg';
import iconCredHover from '@/assets/img/iconCredHover.svg';

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
const tabList: TabItem[] = [
  {
    icon: iconDataHover,
    iconName: 'icon-iconDataHover',
    text: 'Data',
    path: '/datas',
  },
  {
    icon: iconEventsHover,
    iconName: 'icon-iconEventsHover',
    text: 'Events',
    path: '/events',
  },
  {
    icon: iconCredHover,
    iconName: 'icon-iconCredHover',
    text: 'Proofs',
    path: '/cred',
  },
];
const PageHeader = memo(() => {
  const location = useLocation();
  const pathname = location.pathname;
  const dispatch: React.Dispatch<any> = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('Events');
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);
  const [settingDialogVisible, setSettingDialogVisible] =
    useState<boolean>(false);
  const userPassword = useSelector((state: UserState) => state.userPassword);
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
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
      case 'Rewards':
        dispatch(
          setRewardsDialogVisibleAction({
            visible: true,
            tab: 'Badges',
          })
        );
        break;
    }
    setDorpdownVisible(false);
  };
  const onCloseSettingDialog = useCallback(() => {
    setSettingDialogVisible(false);
  }, []);
  const onCloseRewardsDialog = useCallback(() => {
    dispatch(
      setRewardsDialogVisibleAction({
        visible: false,
      })
    );
  }, [dispatch]);

  const formatNavs = useMemo(() => {
    let arr: NavItem[] = [
      {
        icon: iconSetting,
        text: 'Setting',
      },
    ];
    if (connectedWallet?.address || userPassword) {
      arr.push({
        icon: iconRewards,
        text: 'Rewards',
      });
    }
    if (connectedWallet?.address) {
      arr.push({
        icon: iconWallet,
        text: 'Disconnect',
      });
    }
    if (userPassword) {
      arr.push({
        icon: iconLock,
        text: 'Lock Account',
      });
    }
    return arr;
  }, [userPassword, connectedWallet]);
  const handleChangeTab = useCallback(
    (val: string) => {
      setActiveTab(val);
      if (val === 'Data') {
        dispatch({
          type: 'setActiveSourceType',
          payload: 'All',
        });
      }
    },
    [dispatch]
  );

  useEffect(() => {
    connectWalletDialogVisible && setDorpdownVisible(false);
  }, [connectWalletDialogVisible]);

  // icon?: any;
  // tooltip?: string;
  // text: string;
  // disabled?: boolean;
  // path?: string;

  useEffect(() => {
    const currentTabInfo = tabList.find((i) => i.path === pathname);
    setActiveTab(currentTabInfo?.text as string);
  }, [pathname]);

  return (
    <div className="pageHeaderWrapper">
      <header className="pageHeader">
        <div className="pageHeaderInner">
          <img src={logo} className="pLogo" alt="" />
          <PTabsNew
            onChange={handleChangeTab}
            value={activeTab}
            list={tabList}
          />
          <div className="rightHeader">
            <div
              className="rightHeaderInner"
              onClick={handleClickAvatar}
              onMouseEnter={handleEnterAvatar}
              onMouseLeave={handleLeaveAvatar}
            >
              <div className="iconMyWrapper">
                <i className="iconfont icon-iconMy"></i>
              </div>
              <PConnect />
            </div>
            {dorpdownVisible && (
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
      </header>
      {settingDialogVisible && <Setting onClose={onCloseSettingDialog} />}
      <RewardsDialog
        onClose={onCloseRewardsDialog}
        onSubmit={onCloseRewardsDialog}
      ></RewardsDialog>
    </div>
  );
});

export default PageHeader;
