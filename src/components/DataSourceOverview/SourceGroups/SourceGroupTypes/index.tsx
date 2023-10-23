import React, { useState, useCallback, useEffect, memo } from 'react';
import './index.sass';

interface SourceGroupTypesProps {
  onChange: (val: string) => void;
  value?: string;
  list?: string[]
}
const tabList = ['Assets', 'Social', 'Identity'];

const SourceGroupTypes: React.FC<SourceGroupTypesProps> = memo(
  ({ onChange, value, list = tabList }) => {
    const [activeTab, setActiveTab] = useState<string>(list[0]);
    const tabClassCb = useCallback(
      (item: string) => {
        let cN = 'tab';
        cN += ` ${item}`;
        if (activeTab === item) {
          cN += ' activeTab';
        }
        return cN;
      },
      [activeTab]
    );
    const handleClickTab = (item: string) => {
      setActiveTab(item);
      onChange(item);
    };

    useEffect(() => {
      value && setActiveTab(value);
    }, [value]);

    return (
      <div className="sourceGroupTypes">
        <div className="tabs">
          {list.map((item, idx) => {
            return (
              <div
                className={tabClassCb(item)}
                key={idx}
                onClick={() => handleClickTab(item)}
              >
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default SourceGroupTypes;
