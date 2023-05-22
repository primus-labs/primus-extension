import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import iconDataHover from '@/assets/img/iconDataHover.svg';
import iconEventsHover from '@/assets/img/iconEventsHover.svg';
import iconCredHover from '@/assets/img/iconCredHover.svg';
import './index.sass';

interface PInputProps {
  onChange: (val: string) => void;
}
type TabItem = {
  activeIcon: any;
  text: string;
  disabled?: boolean;
  path?: string;
};

const tabs: TabItem[] = [
  {
    activeIcon: iconDataHover,
    text: 'Data',
    path: '/datas',
  },
  {
    activeIcon: iconEventsHover,
    text: 'Events',
    disabled: true,
  },
  {
    activeIcon: iconCredHover,
    text: 'Cred',
    path: '/cred',
  },
];
const PTabs: React.FC<PInputProps> = ({ onChange }) => {
  const [activeTab, setActiveTab] = useState<string>('Data');
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

  return (
    <div className="pTabs">
      {tabs.map((item) => {
        return (
          <div
            className={tabClassCb(item)}
            key={item.text}
            onClick={() => handleClickTab(item)}
            onMouseEnter={() => handleMouseEnter(item)}
            onMouseLeave={handleMouseLeave}
          >
            <img src={item.activeIcon} alt="" />
            <span>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PTabs;
