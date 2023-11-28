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
        
        if (allDisabled || item.disabled) {
          defaultClassName += 'webDataSourceItem disabled';
        }
        if (activeSource?.name === item.name) {
          defaultClassName = 'webDataSourceItem active';
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
        onChange(undefined);
      } else {
        if (!item.disabled) {
          setActiveSource(item);
          onChange(item);
        } else {
          setActiveSource(undefined);
        }
      }
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
