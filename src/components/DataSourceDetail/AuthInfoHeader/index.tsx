import React, { useState, useEffect } from 'react';
import iconChecked from '@/assets/img/iconChecked.svg';
import { getSingleStorageSyncData } from '@/utils/utils'
import './index.sass'

interface AuthInfoHeaderProps {
  onBack?: () => void;
  checked?: boolean;
  backable?:boolean;
}

const AuthInfoHeader: React.FC<AuthInfoHeaderProps> = ({ checked = true, onBack, backable=true }) => {
  const [email, setEmail] = useState<string>()
  const [avatar, setAvatar] = useState<string>()

  const handleClickBack = () => {
    onBack && onBack()
  }
  const getUserInfo = async () => {
    const userInfo: any = await getSingleStorageSyncData('userInfo');
    if (userInfo) {
      const parseUserInfo = JSON.parse(userInfo)
      const { email: em, picture } = parseUserInfo
      setEmail(em)
      setAvatar(picture);
    }
  }
  useEffect(() => {
    getUserInfo()
  }, [])
  return (
    <header className="authInfoHeader">
      {backable && <div className="iconBack" onClick={handleClickBack}></div>}
      
      <div className="content">
        {avatar ? <img className="avatar" src={avatar} alt="back" /> : <i className="avatarAlternate"></i>}
        <span className="email">{email}</span>
        {/* TODO */}
        {checked && <img className="checked" src={iconChecked} alt="back" />}
      </div>
    </header>
  );
};

export default AuthInfoHeader;
