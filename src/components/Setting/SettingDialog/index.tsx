import React, { useState, useMemo, useEffect, memo } from 'react';
import PMask from '@/components/PMask';
import { formatAddress } from '@/utils/utils';
import iconArrow from '@/assets/img/iconArrowLeft2.svg';
import iconMy from '@/assets/img/iconMy.svg'
import iconLoginFrom from '@/assets/img/iconLoginFrom.svg';
import { padoExtensionVersion } from '@/config/constants';
import './index.sass';
import { div } from '../../../utils/utils';

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
      settingType: 'Backup Your Account',
    },
  ],
  [
    {
      moduleType: 'data',
      settingType: 'Manage Your Data',
    },
  ],
  [
    {
      moduleType: 'pado',
      settingType: 'Privacy Policy',
      link: 'https://docs.padolabs.org/Privacy-Policy',
    },
    {
      moduleType: 'pado',
      settingType: 'PADO Support',
      link: 'https://docs.padolabs.org/',
    },
  ],
];
const SettingDialog: React.FC<AddSourceSucDialogProps> = memo(
  ({ onClose, onChange }) => {
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
      const { settingType, link } = settingItem;
      if (link) {
        window.open(link);
      } else {
        onChange(settingType);
      }
    };

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog settingDialog">
          <main>
            <header>
              {avatar ? (
                <img className="avatar" src={avatar} alt="" />
              ) : (
                <i className="avatarAlternate">
                  <img src={iconMy} alt="" />
                </i>
              )}
              <div className="baseInfo">
                <div className="authInfo">
                  <img src={iconLoginFrom} alt="" />
                  <span>{email}</span>
                </div>
                <i className="separtor"></i>
                <div className="accountInfo">
                  <img src={iconMy} alt="" />
                  <span>{formatAddr}</span>
                </div>
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
                          <div className="settingTitle">
                            {sItem.settingType}
                          </div>
                          <img src={iconArrow} alt="" />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </main>
          <footer>Version {padoExtensionVersion}</footer>
        </div>
      </PMask>
    );
  }
);

export default SettingDialog;
