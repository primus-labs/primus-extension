import React, { memo } from 'react';

import './index.scss';

type NavItem = {
  iconName?: any;
  label?: any;
  value?: any;
  disabled?: boolean;
  link?: string;

  icon?: any;
};
interface PSelectProps {
  onClick?: (name: string) => void;
  list: NavItem[];
}

const PSelect: React.FC<PSelectProps> = memo(({ onClick = () => {}, list }) => {
  const handleClickData = (item: NavItem) => {
    if (item.disabled) {
      return;
    }
    onClick(item.label);
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
            key={item.label}
            onClick={() => {
              handleClickData(item);
            }}
          >
            <div className="dropdownItem">
              <i className={`iconfont ${item.iconName}`}></i>
              <div className="desc">{item.label}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
});

export default PSelect;
