import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import logo from '@/assets/img/logo.svg';
import PAvatar from '@/components/PAvatar'
import iconMy from '@/assets/img/iconMy.svg';
import iconLock from '@/assets/img/iconLock.svg';
import './index.sass'

type NavItem = {
  icon: any;
  text: string;
};

const PHeader = () => {
  const navigate = useNavigate()
  const [navs, setNavs] = useState<NavItem[]>([
    {
      icon: iconMy,
      text: 'My',
    },
    {
      icon: iconLock,
      text: 'Lock Account',
    },
  ])
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false)
  const handleClickAvatar = () => {
    setDorpdownVisible(visible => !visible)
  }
  const handleEnterAvatar = () => {
    setDorpdownVisible(true)
  }
  const handleLeaveAvatar = () => {
    setDorpdownVisible(false)
  }
  const handleClickDropdownItem = (text: string) => {
    switch (text) {
      case 'Logout':
        // navigate('/')
        break;
      case 'My':
        // navigate('/my')
        break;
      case 'Lock Account':
        navigate('/lock')
        break;
    }
  }
  return (
    <header className="pageHeader">
      <img src={logo} className="pLogo" alt="logo" />
      <div className="rightHeader">
        <div className="rightHeaderInner" onClick={handleClickAvatar} onMouseEnter={handleEnterAvatar} onMouseLeave={handleLeaveAvatar}>
          <PAvatar />
        </div>
        {dorpdownVisible &&
          <div className="dropdownWrapper" onMouseEnter={handleEnterAvatar} onMouseLeave={handleLeaveAvatar}>
            <ul className="dropdown">
              {navs.map(item => {
                return (<li key={item.text} className="dropdownItemWrapper" onClick={() => { handleClickDropdownItem(item.text) }}>
                  <div className="dropdownItem">
                    <img src={item.icon} alt="" />
                    <span>{item.text}</span>
                  </div>
                </li>)
              })}
            </ul>
          </div>
        }
      </div>
    </header>
  );
};

export default PHeader;