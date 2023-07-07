import React, { useState, useCallback, useEffect, memo } from 'react';
import './index.sass';

interface SourceGroupTypesProps {
  onChange: (val: string) => void;
  value?: string;
}
const tabList = ['Assets', 'Social', 'eKYC'];

const SourceGroupTypes: React.FC<SourceGroupTypesProps> = memo(
  ({ onChange, value }) => {
    const [activeTab, setActiveTab] = useState<string>(tabList[0]);
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
      onChange(item)
    };

    useEffect(() => {
      value && setActiveTab(value);
    }, [value]);

    return (
      <div className="sourceGroupTypes">
        <div className="tabs">
          {tabList.map((item, idx) => {
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
