import React, { useState, useEffect } from 'react';
import iconAddress from '@/assets/img/iconAddress.svg';
import './index.sass'

interface AuthInfoHeaderProps {
}

const AddressInfoHeader: React.FC<AuthInfoHeaderProps> = () => {
  const [accountAddr, setAccountAddr] = useState<any>();
  const initPage = async () => {
    const res = await chrome.storage.local.get(['keyStore']);
    const keyStoreStr = res.keyStore;
    const parseKeyStore = JSON.parse(keyStoreStr as string);
    setAccountAddr('0x' + parseKeyStore.address);
    
  };
  useEffect(() => {
    initPage();
  }, []);
  return (
    <header className="addressInfoHeader">
      <div className="content">
        <div className="iconAddressWrapper">
          <img className="avatar" src={iconAddress} alt="" />
        </div>
        <p className="address">{accountAddr}</p>
      </div>
    </header>
  );
};

export default AddressInfoHeader;
