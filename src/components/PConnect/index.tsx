import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { formatAddress } from '@/utils/utils';
import iconMy from '@/assets/img/iconMy.svg'
import PButton from '@/components/PButton'
import './index.scss';

const PConnect = memo(() => {
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
  const handleConnect = useCallback(() => {

  },[])
  // useEffect(() => {
  //   getUserInfo();
  // }, []);
  return (
    <div className="PConnect">
      <PButton text="Connect Wallet" onClick={handleConnect} />
    </div>
  );
});

export default PConnect;
