import React, { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router';

import iconDataHover from '@/assets/img/iconDataHover.svg';
import iconEventsHover from '@/assets/img/iconEventsHover.svg';
import iconCredHover from '@/assets/img/iconCredHover.svg';
import iconTooltip from '@/assets/img/credit/iconTooltip.svg';
import './index.sass';

type TabItem = {
  icon?: any;
  tooltip?: string;
  text: string;
  disabled?: boolean;
  path?: string;
};
interface PInputProps {
  onChange: (val: string) => void;
  value?: string;
  list: TabItem[];
}

const PTabs: React.FC<PInputProps> = memo(({ onChange, value, list }) => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [focusTab, setFocusTab] = useState<string>();
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleClickTab = (item: TabItem) => {
    if (!item.disabled) {
      setActiveTab(item.text);
      onChange(item.text);
      item.path && navigate(item.path);
    }
  };
  const handleMouseEnter = (item: TabItem) => {
    // if(!item.disabled) {
    setFocusTab(item.text);
    // }
  };
  const handleMouseLeave = () => {
    setFocusTab('');
  };
  const tabClassCb = useCallback(
    (item: TabItem) => {
      let cN = 'tab';
      if (activeTab === item.text) {
        cN += ' activeTab';
      }
      if (focusTab === item.text) {
        cN += ' focusTab';
      }
      if (item.disabled) {
        cN += ' disabled';
      }
      return cN;
    },
    [focusTab, activeTab]
  );
  const handleEnterAvatar = () => {
    setTooltipVisible(true);
  };
  const handleLeaveAvatar = () => {
    setTooltipVisible(false);
  };
  useEffect(() => {
    value && setActiveTab(value);
  }, [value]);

  return (
    <div className="pTabsNew">
      {list.map((item) => {
        return (
          <div
            className={tabClassCb(item)}
            key={item.text}
            onClick={() => handleClickTab(item)}
            onMouseEnter={() => handleMouseEnter(item)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="con">
              {item.icon && <img src={item.icon} alt="" />}
              <span>{item.text}</span>
              {item.tooltip && (
                <img
                  className="iconTooltip"
                  src={iconTooltip}
                  alt=""
                  onMouseEnter={handleEnterAvatar}
                  onMouseLeave={handleLeaveAvatar}
                />
              )}
              <i className="borderB"></i>
            </div>
            {item.tooltip && tooltipVisible && (
              <p className="tooltip">{item.tooltip}</p>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default PTabs;
