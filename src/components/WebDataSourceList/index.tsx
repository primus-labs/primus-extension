import React, { FC, useCallback, useState, useEffect, memo } from 'react';

import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import './index.sass';
type DataSourceItemType = {
  icon: any;
  name: string;
  id?: string;
};
interface ConnectDataSourceListProps {
  disabled?: boolean;
  list: DataSourceItemType[];
  onChange: (source: DataSourceItemType | undefined) => void;
}
const ConnectDataSourceList: FC<ConnectDataSourceListProps> = memo(
  ({ onChange, list, disabled: allDisabled = false }) => {
    const [activeSource, setActiveSource] = useState<DataSourceItemType>();

    const liClassNameCallback = useCallback(
      (item: DataSourceItemType) => {
        let defaultClassName = 'webDataSourceItem';
        if (activeSource?.name === item.name) {
          defaultClassName += ' active';
        }
        if (allDisabled) {
          defaultClassName += ' disabled';
        }
        return defaultClassName;
      },
      [activeSource, allDisabled]
    );

    const handleClickData = (item: DataSourceItemType) => {
      if (allDisabled) {
        return;
      }
      if (activeSource?.name === item.name) {
        setActiveSource(undefined);
      } else {
        setActiveSource(item);
      }
      onChange(item);
    };

    // useEffect(() => {
    //   activeSource && onChange(activeSource);
    // }, [activeSource, onChange]);
    return (
      <div className="webDataSourceListWrapper">
        {list.length > 0 && (
          <ul className="webDataSourceList">
            {list.map((item) => {
              return (
                <li
                  className={liClassNameCallback(item)}
                  key={item.name}
                  onClick={() => {
                    handleClickData(item);
                  }}
                >
                  <img src={item.icon} alt="" />
                  {/* <h6>{item.name}</h6> */}
                </li>
              );
            })}
          </ul>
        )}
        {list.length === 0 && (
          <div className="emptyContent">
            <img src={iconInfoGray} alt="" />
            <h2>empty.</h2>
          </div>
        )}
      </div>
    );
  }
);
export default ConnectDataSourceList;
