import React, { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router';

import iconDataHover from '@/assets/img/iconDataHover.svg';
import iconEventsHover from '@/assets/img/iconEventsHover.svg';
import iconCredHover from '@/assets/img/iconCredHover.svg';
import './index.sass';

type TabItem = {
  icon?: any;
  text: string;
  disabled?: boolean;
  path?: string;
};
interface PInputProps {
  onChange: (val: string) => void;
  value?: string;
  list: TabItem[];
}



const PTabs: React.FC<PInputProps> = memo(({ onChange, value,list }) => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [focusTab, setFocusTab] = useState<string>();

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
              <i className="borderB"></i>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default PTabs;
