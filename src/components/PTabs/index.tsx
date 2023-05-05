import React, { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import iconData from '@/assets/img/iconData.svg';
import iconDataHover from '@/assets/img/iconDataHover.svg';
import iconEvents from '@/assets/img/iconEvents.svg';
import iconEventsHover from '@/assets/img/iconEventsHover.svg';
import './index.sass';

interface PInputProps {
  onChange: (val: string) => void;
}
type TabItem = {
  icon: any;
  activeIcon: any;
  text: string;
  disabled?:boolean
};

const PTabs: React.FC<PInputProps> = ({ onChange }) => {
  const [tabs, setTabs] = useState<TabItem[]>([
    {
      icon: iconData,
      activeIcon: iconDataHover,
      text: 'Data',
    },
    {
      icon: iconEvents,
      activeIcon: iconEventsHover,
      text: 'Events',
      disabled: true
    },
  ]);
  const [activeTab, setActiveTab] = useState<string>('Data');
  const [focusTab, setFocusTab] = useState<string>();

  const handleClickTab = (item: TabItem) => {
    if(!item.disabled) {
      setActiveTab(item.text);
      onChange(item.text)
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
  const tabClassCb = useCallback((item: TabItem) => {
    let cN = 'tab'
    if (activeTab === item.text) {
      cN += ' activeTab'
    }
    if (focusTab === item.text) {
      cN += ' focusTab'
    }
    if (item.disabled) {
      cN += ' disabled'
    }
    return cN
  },[focusTab, activeTab])

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
            <img
              src={activeTab === item.text || focusTab === item.text ? item.activeIcon : item.icon}
              alt=""
            />
            <span>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PTabs;
