import React, { memo, useCallback, useMemo } from 'react';
import PButton from '@/newComponents/PButton';
import PTooltip from '@/newComponents/PTooltip';
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
    const includeAll = useMemo(() => {
      const includeA = list.find((i) => i.value === 'All');
      return !!includeA;
    }, []);
    const formatOptionCN = useCallback(
      (item) => {
        let str = 'dropdownOption';
        if (item?.disabled) {
          str += ' disabled';
        }
        if (value === item.value && !includeAll) {
          str += ' selected';
        }

        return str;
      },
      [includeAll]
    );
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
              >
                <div className="dropdownOptionCon">
                  <div className={`left`}>
                    {includeAll &&
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
                    <div className={`desc`}>{item.label}</div>
                  </div>
                  {item.disabled && item?.tooltip && (
                    <PTooltip title={item?.tooltip}>
                      <PButton
                        type="icon"
                        icon={<i className="iconfont icon-iconInfo"></i>}
                        onClick={() => {}}
                        className="tooltipBtn"
                      />
                    </PTooltip>
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
