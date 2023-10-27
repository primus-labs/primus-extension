import React, { FC, useCallback, useState, useEffect, memo } from 'react';

import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import './index.scss';
type DataSourceItemType = {
  icon: any;
  name: string;
  id?: string;
  disabled?: boolean
};
interface ConnectDataSourceListProps {
  val?: any;
  disabled?: boolean;
  list: DataSourceItemType[];
  onChange: (source: DataSourceItemType | undefined) => void;
}
const ConnectDataSourceList: FC<ConnectDataSourceListProps> = memo(
  ({ onChange, list, disabled: allDisabled = false, val }) => {
    const [activeSource, setActiveSource] = useState<DataSourceItemType>();

    const liClassNameCallback = useCallback(
      (item: DataSourceItemType) => {
        let defaultClassName = 'webDataSourceItem';
        if (activeSource?.name === item.name) {
          defaultClassName += ' active';
        }
        if (allDisabled || item.disabled) {
          defaultClassName += ' disabled';
        }
        return defaultClassName;
      },
      [activeSource, allDisabled]
    );

    const handleClickData = (item: DataSourceItemType) => {
      if (allDisabled) {
        onChange(item);
        return;
      }
      if (activeSource?.name === item.name) {
        setActiveSource(undefined);
      } else {
        setActiveSource(item);
      }
      onChange(item);
    };

    useEffect(() => {
      if (val) {
        setActiveSource(val)
      }
    }, [val]);
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
      </div>
    );
  }
);
export default ConnectDataSourceList;
