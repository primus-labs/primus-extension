import React, { useState, useMemo, useEffect } from 'react';
import './index.sass';
import PMask from '@/components/PMask';
import { formatAddress } from '@/utils/utils';
import iconArrow from '@/assets/img/iconArrowLeft2.svg';
interface AddSourceSucDialogProps {
  onClose: () => void;
  onChange: (type: string) => void;
}

const moduleObj = [
  [
    {
      moduleType: 'wallet',
      settingType: 'Change Password',
    },
    {
      moduleType: 'wallet',
      settingType: 'Back up on-chain address',
    },
  ],
  [
    {
      moduleType: 'data',
      settingType: 'Manage your data',
    },
  ],
  [
    {
      moduleType: 'pado',
      settingType: 'Privacy Policy',
    },
    {
      moduleType: 'pado',
      settingType: 'PADO Support',
    },
  ],
];
const SettingDialog: React.FC<AddSourceSucDialogProps> = ({
  onClose,
  onChange,
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
  useEffect(() => {
    getUserInfo();
  }, []);
  const onClickSettingItem = (settingItem: any) => {
    const { settingType } = settingItem;
    onChange(settingType);
  };

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog settingDialog">
        <main>
          <header>
            {avatar ? (
              <img className="avatar" src={avatar} alt="" />
            ) : (
              <i className="avatarAlternate"></i>
            )}
            <div className="baseInfo">
              <span>{email}</span>
              <i className="separtor"></i>
              <span>{formatAddr}</span>
            </div>
          </header>
          <div className="settingContent">
            {moduleObj.map((mItem) => {
              return (
                <div className="moduleItem" key={mItem[0].moduleType}>
                  {mItem.map((sItem) => {
                    return (
                      <div
                        className="settingItem"
                        key={sItem.settingType}
                        onClick={() => onClickSettingItem(sItem)}
                      >
                        <div className="settingTitle">{sItem.settingType}</div>
                        <img src={iconArrow} alt="" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </main>
        <footer>Version 0.01</footer>
      </div>
    </PMask>
  );
};

export default SettingDialog;
