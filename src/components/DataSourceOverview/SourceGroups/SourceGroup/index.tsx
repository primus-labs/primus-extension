import React, { FC, useCallback, useState, useEffect, memo } from 'react';

import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import './index.scss';

import type { ConnectSourceType } from '@/types/dataSource';
import type { ExchangeMeta } from '@/types/dataSource';
import type { WALLETITEMTYPE } from '@/config/constants';

export type ListItem = ExchangeMeta | WALLETITEMTYPE;
interface ConnectDataSourceListProps {
  mutiple?: boolean;
  onChange: (source: ListItem) => void;
  list: ListItem[];
  activeList?: string[];
  val?: ListItem;
}

const ConnectDataSourceList: FC<ConnectDataSourceListProps> = memo(
  ({ mutiple = false, onChange, list, activeList, val }) => {
    const [activeSource, setActiveSource] = useState<ListItem>();
    const [activeSources, setActiveSources] = useState<ListItem[]>([]);

    const liClassNameCallback = useCallback(
      (item: ListItem) => {
        let defaultClassName = 'networkItem';
        // if (item.name === 'On-chain') {
        //   defaultClassName += ' onChain';
        // }
        if (!mutiple && !item?.disabled && activeSource?.name === item.name) {
          defaultClassName += ' active';
        }
        if (activeList && activeList?.length > 0) {
          if (activeList.includes(item.name)) {
            defaultClassName += ' excitable';
          } else {
            defaultClassName += ' disabled';
          }
        }
        if (item?.disabled) {
          defaultClassName += ' disabled';
        }
        if (item.name === 'BNB Greenfield') {
          defaultClassName += ' lh1';
        }
        
        if (mutiple) {
          const flag = activeSources.find((i) => i.name === item.name);
          if (flag) {
            defaultClassName += ' active';
          }
        }
        return defaultClassName;
      },
      [activeSource, activeSources, mutiple, activeList]
    );

    const handleClickData = (item: ListItem) => {
      if (item?.disabled) {
        return;
      }
      if (val && val.name === item.name) {
        return
      }
      if (!mutiple) {
        if (activeSource?.name === item.name) {
          setActiveSource(undefined);
        } else {
          setActiveSource(item);
        }
      }
      if (mutiple) {
        const existIndex = activeSources.findIndex((i) => i.name === item.name);
        let newActiveSources = [...activeSources];
        if (existIndex > -1) {
          newActiveSources.splice(existIndex, 1);
        } else {
          newActiveSources.push(item);
        }
        setActiveSources([...newActiveSources]);
      }
    };

    // useEffect(() => {
    //   if (mutiple) {
    //     onChange(activeSources);
    //   } else {
    //     onChange(activeSource);
    //   }
    // }, [activeSource, mutiple, activeSources, onChange]);
    useEffect(() => {
      if (activeSource) {
        onChange(activeSource);
      }
    }, [activeSource, onChange]);
    useEffect(() => {
      val && setActiveSource(val);
    }, [val]);
  

    return (
      <div className="scroll sourceGroup">
        {list.length > 0 && (
          <ul className="dataList">
            {list.map((item) => {
              return (
                <li
                  className={liClassNameCallback(item)}
                  key={item.name}
                  onClick={() => {
                    handleClickData(item);
                  }}
                >
                  <img
                    src={
                      'iconWithCircle' in item
                        ? item?.iconWithCircle ?? item.icon
                        : item.icon
                    }
                    alt=""
                  />
                  <h6>{item.name}</h6>
                  {/* <div className="extraTip">{item?.desc}</div> */}
                </li>
              );
            })}
          </ul>
        )}
        {list.length === 0 && (
          <div className="emptyContent">
            <img src={iconInfoGray} alt="" />
            <h2>
              You haven’t connected any data sources yet. Please go to the Data
              page to add some.
            </h2>
          </div>
        )}
      </div>
    );
  }
);
export default ConnectDataSourceList;
