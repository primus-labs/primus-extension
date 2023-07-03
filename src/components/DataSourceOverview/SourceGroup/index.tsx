import React, {
  FC,
  useMemo,
  useCallback,
  useState,
  useEffect,
  memo,
} from 'react';
import { useSelector } from 'react-redux';

import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import './index.sass';

import { DATASOURCEMAP } from '@/config/constants';

import type { ConnectSourceType } from '@/types/dataSource';
import type { UserState } from '@/types/store';
import type { ExchangeMeta } from '@/types/config';

interface ConnectDataSourceListProps {
  mutiple?: boolean;
  onChange: (source: ExchangeMeta) => void;
  list: ExchangeMeta[];
}
const ConnectDataSourceList: FC<ConnectDataSourceListProps> = memo(
  ({ mutiple = false, onChange, list }) => {
    const [activeSource, setActiveSource] = useState<ExchangeMeta>();
    const [activeSources, setActiveSources] = useState<ExchangeMeta[]>([]);

    const liClassNameCallback = useCallback(
      (item: ConnectSourceType) => {
        let defaultClassName = 'networkItem';
        if (!mutiple && activeSource?.name === item.name) {
          defaultClassName += ' active';
        }
        if (mutiple) {
          const flag = activeSources.find((i) => i.name === item.name);
          if (flag) {
            defaultClassName += ' active';
          }
        }
        return defaultClassName;
      },
      [activeSource, activeSources, mutiple]
    );

    const handleClickData = (item: ExchangeMeta) => {
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
                  <img src={item.icon} alt="" />
                  <h6>{item.name}</h6>
                  <div className="extraTip">{item.desc}</div>
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
