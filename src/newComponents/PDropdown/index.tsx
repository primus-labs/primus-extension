import React, { memo,useCallback } from 'react';
import './index.scss';

type NavItem = {
  iconName?: any;
  label?: any;
  value?: any;
  disabled?: boolean;
  link?: string;

  icon?: any;
};
interface PDropdownProps {
  onClick?: (value: any, item: NavItem) => void;
  list: NavItem[];
}

const PDropdown: React.FC<PDropdownProps> = memo(
  ({ onClick = () => { }, list }) => {
    const formatOptionCN = useCallback((item) => {
      let str = 'dropdownOption'
      if (item?.disabled) {
        str += ' disabled'
      }
      return str
    },[])
    const handleClickData = (item: NavItem) => {
      if (item.disabled) {
        return;
      }
      onClick(item.value, item);
    };
    return (
      <div className="PDropdown">
        <ul className="dropdownOptions">
          {list.map((item) => {
            return (
              <li
                className={formatOptionCN(item)}
                key={item.value}
                onClick={() => {
                  handleClickData(item);
                }}
              >
                <div className="dropdownOptionCon">
                  {item.iconName ? (
                    <i className={`iconfont ${item.iconName}`}></i>
                  ) : item.icon ? (
                    <img src={item.icon} alt="" />
                  ) : undefined}
                  <div className="desc">{item.label}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
);

export default PDropdown;
