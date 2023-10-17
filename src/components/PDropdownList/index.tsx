import React, {  memo } from 'react';

import iconWallet from '@/assets/img/layout/iconWallet.svg';
import iconSetting from '@/assets/img/iconSetting.svg';
import iconLock from '@/assets/img/iconLock.svg';

import './index.scss';


type NavItem = {
  icon: any;
  text: string;
};
interface DataSourcesDialogProps {
  onClick?: (name: string) => void;
  list?: NavItem[];
}
const navs: NavItem[] = [
  // {
  //   icon: iconMy,
  //   text: 'My',
  // },
  {
    icon: iconSetting,
    text: 'Setting',
  },
  {
    icon: iconLock,
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
      onClick(item.text);
    };
    return (
      <ul className="dropdown">
        {list.map((item) => {
          return (
            <li
              className="dropdownItemWrapper"
              key={item.text}
              onClick={() => {
                handleClickData(item);
              }}
            >
              <div className="dropdownItem">
                <img src={item.icon} alt="" />
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
