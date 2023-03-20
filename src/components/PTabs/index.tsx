import React, { useState } from 'react';
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
    },
  ]);
  const [activeTab, setActiveTab] = useState<string>('Data');

  const handleClickTab = (text: string) => {
    setActiveTab(text);
    onChange(text)
  };

  return (
    <div className="pTabs">
      {tabs.map((item) => {
        return (
          <div
            className={activeTab === item.text ? 'tab activeTab' : 'tab'}
            key={item.text}
            onClick={() => handleClickTab(item.text)}
          >
            <img
              src={activeTab === item.text ? item.activeIcon : item.icon}
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
