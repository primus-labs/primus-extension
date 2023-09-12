import React, { useEffect, useState, useMemo, memo } from 'react';
import { formatAddress } from '@/utils/utils';
import iconMy from '@/assets/img/iconMy.svg'
import './index.sass';
const PAvatar = memo(() => {
  const [avatar, setAvatar] = useState<any>();
  const [address, setAddress] = useState<string>();
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('0x' + address);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const formatAddr = useMemo(() => {
    return address ? formatAddress('0x' + address) : '';
  }, [address]);

  const getUserInfo = () => {
    chrome.storage.local.get(
      ['userInfo', 'keyStore'],
      ({ userInfo, keyStore }) => {
        if (userInfo) {
          const parseUserInfo = JSON.parse(userInfo);
          const { picture } = parseUserInfo;
          setAvatar(picture);
        }
        if (keyStore) {
          const parseKeystore = JSON.parse(keyStore);
          const { address } = parseKeystore;
          setAddress(address);
        }
      }
    );
  };

  useEffect(() => {
    getUserInfo();
  }, []);
  return (
    <div className="pAvatar">
      {/* {avatar ? (
        <img className="avatar" src={avatar} alt="" />
      ) : (
        <div className="avatar"></div>
      )} */}
      <div className="avatar">
        <img src={iconMy} alt="" />
      </div>
      <div className="address" onClick={handleCopy}>
        {formatAddr}
        {copied && (
          <div className="copyTip">
            <span>Copied</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default PAvatar;
