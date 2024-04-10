import React, { memo, useCallback } from 'react';
import PButton from '@/newComponents/PButton';
import './index.scss';

type NavItem = {
  iconName?: any;
  label?: any;
  value?: any;
  disabled?: boolean;
  link?: string;
  tooltip?: string;

  icon?: any;
};
interface PDropdownProps {
  value?: any;
  onClick?: (value: any, item: NavItem) => void;
  list: NavItem[];
  showSelf?: boolean;
}

const PDropdown: React.FC<PDropdownProps> = memo(
  ({ onClick = () => {}, list, value, showSelf }) => {
    const formatOptionCN = useCallback((item) => {
      let str = 'dropdownOption';
      if (item?.disabled) {
        str += ' disabled';
      }
      return str;
    }, []);
    const handleClickData = (item: NavItem) => {
      if (!item.disabled) {
        onClick(item.value, item);
      }
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
                title={item.disabled ? item?.tooltip : ''}
              >
                <div className="dropdownOptionCon">
                  <div className="left">
                    {showSelf &&
                      (value === item.value ? (
                        <i className="iconfont icon-Legal" />
                      ) : (
                        <div className="placeHolder"></div>
                      ))}
                    {item.iconName ? (
                      <i className={`iconfont ${item.iconName}`}></i>
                    ) : item.icon ? (
                      <img src={item.icon} alt="" className="iconImg" />
                    ) : undefined}
                    <div className="desc">{item.label}</div>
                  </div>
                  {item.disabled && item?.tooltip && (
                    <PButton
                      type="icon"
                      icon={<i className="iconfont icon-iconInfo"></i>}
                      onClick={() => {}}
                      className="tooltipBtn"
                    />
                  )}
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
