import React, { useState, useCallback, useEffect, memo } from 'react';
import iconPieTabExchange from '@/assets/img/iconPieTabExchange.svg';
import iconPieTabToken from '@/assets/img/iconPieTabToken.svg';
import './index.sass';

interface PInputProps {
  onChange: (val: string) => void;
  value?: string;
}
type TabItem = {
  icon: any;
  text: string;
};

const pieTabList: TabItem[] = [
  { text: 'Source', icon: iconPieTabExchange },
  { text: 'Token', icon: iconPieTabToken },
];

const PTabs: React.FC<PInputProps> = memo(({ onChange, value }) => {
  const [activeTab, setActiveTab] = useState<string>('Data');

  const handleClickTab = (item: TabItem) => {
    setActiveTab(item.text);
    onChange(item.text);
  };

  const tabClassCb = useCallback(
    (item: TabItem) => {
      let cN = 'tab';
      if (activeTab === item.text) {
        cN += ' activeTab';
      }
      return cN;
    },
    [activeTab]
  );

  useEffect(() => {
    value && setActiveTab(value);
  }, [value]);

  return (
    <ul className="pieTabs">
      {pieTabList.map((item) => {
        return (
          <li
            className={tabClassCb(item)}
            key={item.text}
            onClick={() => handleClickTab(item)}
          >
            <img src={item.icon} alt="" />
          </li>
        );
      })}
    </ul>
  );
});

export default PTabs;
