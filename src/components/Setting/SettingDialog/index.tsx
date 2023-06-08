import React, { useState, useMemo } from 'react';
import './index.sass';
import PMask from '@/components/PMask';
import {formatAddress} from '@/utils/utils'

interface AddSourceSucDialogProps {
  onClose: () => void;
}

const SettingDialog: React.FC<AddSourceSucDialogProps> = ({
  onClose,
  
}) => {
  const [email, setEmail] = useState<string>();
  const [avatar, setAvatar] = useState<string>();
  const [address, setAddress] = useState<string>();

  const getUserInfo = async () => {
    const res: any = await chrome.storage.local.get(['userInfo', 'keyStore']);
    const { userInfo, keyStore } = res;
    if (userInfo) {
      const parseUserInfo = JSON.parse(userInfo);
      const { picture, formatUser } = parseUserInfo;
      setEmail(formatUser);
      setAvatar(picture);
    }
    
      if (keyStore) {
        const parseKeystore = JSON.parse(keyStore);
        const { address } = parseKeystore;
        setAddress(address);
      }
    
  };
  const formatAddr = useMemo(() => {
    return address ? formatAddress('0x' + address) : '';
  }, [address]);
  
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog settingDialog">
        <main>
          {avatar ? (
            <img className="avatar" src={avatar} alt="" />
          ) : (
            <i className="avatarAlternate"></i>
          )}
          <span className="email">{email}</span>
        </main>
        <footer></footer>
      </div>
    </PMask>
  );
};

export default SettingDialog;
