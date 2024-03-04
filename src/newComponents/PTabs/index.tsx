import React, { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router';
import './index.scss';

export type TabItem = {
  iconName?: any;
  label?: any;
  value?: any;
  disabled?: boolean;
  link?: string;


  icon?: any;
  tooltip?: string;
  
  path?: string;
};
interface PInputProps {
  onChange: (val: string, item: TabItem) => void;
  value?: string;
  list: TabItem[];
}

const PTabs: React.FC<PInputProps> = memo(({ onChange, value, list }) => {
  const [activeTab, setActiveTab] = useState<string>('');
   const navigate = useNavigate();

  const handleClickTab = (item: TabItem) => {
    if (!item.disabled) {
      setActiveTab(item.value);
      onChange(item.value, item);
      item.link && navigate(item.link);
    }
  };
  
  const tabClassCb = useCallback(
    (item: TabItem) => {
      let cN = 'tab';
      if (activeTab === item.value) {
        cN += ' active';
      }
      if (item.disabled) {
        cN += ' disabled';
      }
      return cN;
    },
    [activeTab]
  );
  
  useEffect(() => {
    if (value) {
      const activeItem = list.find((i) => i.value === value);
      setActiveTab(activeItem?.value);
    }
  }, [value, list]);

  return (
    <div className="PTabs">
      {list.map((item) => {
        return (
          <div
            className={tabClassCb(item)}
            key={item.value}
            onClick={() => handleClickTab(item)}
          >
            <div className="con">
              <span>{item.label}</span>
            </div>
            <div className="border"></div>
          </div>
        );
      })}
    </div>
  );
});

export default PTabs;
