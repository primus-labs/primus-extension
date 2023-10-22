import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import {useSelector} from 'react-redux'
import PMask from '@/components/PMask';
import { formatAddress } from '@/utils/utils';
import iconArrow from '@/assets/img/iconArrowLeft2.svg';
import iconMy from '@/assets/img/iconMy.svg';
import iconLoginFrom from '@/assets/img/iconLoginFrom.svg';
import { padoExtensionVersion } from '@/config/constants';
import './index.sass';
import { div } from '../../../utils/utils';

import { DATASOURCEMAP } from '@/config/constants';

import type { ConnectSourceType } from '@/types/dataSource';
import type { UserState } from '@/types/store';
import type { ExchangeMeta } from '@/types/dataSource';

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
    //   {
    //     moduleType: 'wallet',
    //     settingType: 'Backup Account',
    //   },
    // ],
    // [
    {
      moduleType: 'data',
      settingType: 'Manage Data',
    },
  ],
  [
    {
      moduleType: 'pado',
      settingType: 'PADO Support',
      link: 'https://docs.padolabs.org/',
    },
    {
      moduleType: 'pado',
      settingType: 'Privacy Policy',
      link: 'https://docs.padolabs.org/Privacy-Policy',
    },
  ],
];
const SettingDialog: React.FC<AddSourceSucDialogProps> = memo(
  ({ onClose, onChange }) => {
    const [address, setAddress] = useState<string>();
    const userPassword = useSelector((state: UserState) => state.userPassword);
    const exSources = useSelector((state: UserState) => state.exSources);
    const socialSources = useSelector(
      (state: UserState) => state.socialSources
    );
    const kycSources = useSelector((state: UserState) => state.kycSources);
    const onChainAssetsSources = useSelector(
      (state: UserState) => state.onChainAssetsSources
    );
   
    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );

    const connectedSourceList: ConnectSourceType[] = useMemo(() => {
      const exArr = Object.keys(exSources).map((key) => {
        const sourceInfo: ExchangeMeta =
          DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
        const { name, icon, type } = sourceInfo;
        const { exUserId, label } = exSources[key];
        const infoObj: ConnectSourceType = {
          name,
          icon,
          exUserId,
          label,
          type,
        };
        return infoObj;
      });
      const socialArr = Object.keys(socialSources).map((key) => {
        const sourceInfo: ExchangeMeta =
          DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
        const { name, icon, type } = sourceInfo;
        const { label } = socialSources[key];
        const infoObj: ConnectSourceType = {
          name,
          icon,
          label,
          type,
        };
        return infoObj;
      });

      const kycArr = Object.keys(kycSources).map((key) => {
        const sourceInfo: ExchangeMeta =
          DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
        const { name, icon, type } = sourceInfo;
        const { label } = kycSources[key];
        const infoObj: ConnectSourceType = {
          name,
          icon,
          label,
          type,
        };
        return infoObj;
      });
      const onChainArr = Object.keys(onChainAssetsSources).map((key) => {
        const sourceInfo: ExchangeMeta = DATASOURCEMAP['onChain'];
        const { name, icon, type } = sourceInfo;
        const { label, address } = onChainAssetsSources[key];
        const infoObj: ConnectSourceType = {
          name: formatAddress(address, 4, 2),
          icon,
          label,
          type,
          address,
        };
        return infoObj;
      });
      return [...exArr, ...socialArr, ...kycArr, ...onChainArr];
    }, [exSources, socialSources, kycSources, onChainAssetsSources]);

    
    
    const formatModuleObj = useMemo(() => {
      let obj = [...moduleObj];
      if (!userPassword) {
        obj.splice(0, 1);
      } else {
        
        if (connectedSourceList?.length === 0) {
          obj[0] = obj[0].filter((i) => i.moduleType === 'wallet');
        }
      }
      return obj;
    }, [userPassword,connectedSourceList]);
   
   
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
              <div className="avatarAlternate">
                <img src={iconMy} alt="" />
              </div>
              <div className="baseInfo">
                <h6>Hi</h6>
                <div className="accountInfo">
                  <p>PADO Account</p>
                  <p>{walletAddress}</p>
                </div>
              </div>
            </header>
            <div className="settingContent">
              {formatModuleObj.map((mItem) => {
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
