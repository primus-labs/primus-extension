import React, { memo } from 'react';

import iconWallet from '@/assets/img/layout/iconWallet.svg';
import iconSetting from '@/assets/img/iconSetting.svg';
import iconLock from '@/assets/img/iconLock.svg';

import './index.scss';

type NavItem = {
  value?: any;
  iconName?: string;
  icon?: any;
  text: string;
  disabled?: boolean;
};
interface DataSourcesDialogProps {
  onClick?: (name: string) => void;
  list?: NavItem[];
}
const navs: NavItem[] = [
  {
    icon: iconSetting,
    text: 'Setting',
  },
  {
    iconName: 'iconLock',
    text: 'Lock Account',
  },
  {
    icon: iconWallet,
    text: 'Disconnect',
  },
];
const PDropdownList: React.FC<DataSourcesDialogProps> = memo(
  ({ onClick = () => {}, list = navs }) => {
    const handleClickData = (item: NavItem) => {
      if (item.disabled) {
        return;
      }
      onClick(item.text);
    };
    return (
      <ul className="padodropdown">
        {list.map((item) => {
          return (
            <li
              className={
                item.disabled
                  ? 'dropdownItemWrapper disabled'
                  : 'dropdownItemWrapper'
              }
              key={item.text}
              onClick={() => {
                handleClickData(item);
              }}
            >
              <div className="dropdownItem">
                {item.iconName ? (
                  <i className={`iconfont ${item.iconName}`}></i>
                ) : item.icon ? (
                  <img src={item.icon} alt="" />
                ) : undefined}
                <div className="desc">{item.text}</div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }
);

export default PDropdownList;
