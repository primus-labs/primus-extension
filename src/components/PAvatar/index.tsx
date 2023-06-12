import React, { useEffect, useState, useMemo } from 'react';
import { formatAddress } from '@/utils/utils'
import './index.sass';
const PAvatar = () => {
  const [avatar, setAvatar] = useState<any>();
  const [address, setAddress] = useState<string>();
  const formatAddr = useMemo(() => {
    return address ? formatAddress('0x'+address) : ''
  }, [address])
  const getUserInfo = () => {
    chrome.storage.local.get(['userInfo', 'keyStore'], ({ userInfo, keyStore }) => {
      if (userInfo) {
        const parseUserInfo = JSON.parse(userInfo);
        const { picture } = parseUserInfo
        setAvatar(picture);
      }
      if (keyStore) {
        const parseKeystore = JSON.parse(keyStore);
        const { address } = parseKeystore;
        setAddress(address);
      }
    });
  };

  useEffect(() => {
    getUserInfo();
  }, []);
  return (
    <div className="pAvatar">
      {avatar ? (
        <img className="avatar" src={avatar} alt="" />
      ) : (
        <div className="avatar"></div>
      )}
      <div className="address">{formatAddr}</div>
    </div>
  );
};

export default PAvatar;
