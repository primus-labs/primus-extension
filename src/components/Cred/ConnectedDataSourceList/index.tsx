import React, { FC, useMemo, useCallback, useState } from 'react';
import type { ConnectSourceType } from '@/types/dataSource'
import { useSelector, useDispatch } from 'react-redux';
import type { UserState } from '@/types/store';
import type { ExchangeMeta } from '@/types/config';
import { DATASOURCEMAP } from '@/config/constants';
import type {CredTypeItemType} from '@/types/cred'
import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import './index.sass'
interface ConnectDataSourceListProps {
  activeCred?: CredTypeItemType;
  activeSourceName?: string;
  mutiple?: boolean;
}
const ConnectDataSourceList: FC<ConnectDataSourceListProps> = ({
  activeCred,
  activeSourceName,
  mutiple = false,
}) => {
  const exSources = useSelector((state: UserState) => state.exSources);
  const [activeSource, setActiveSource] = useState<ConnectSourceType>();
  const connectedSourceList: ConnectSourceType[] = useMemo(() => {
    return Object.keys(exSources).map((key) => {
      const sourceInfo: ExchangeMeta =
        DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
      const { name, icon } = sourceInfo;
      const { exUserId, label } = exSources[key];
      const infoObj: ConnectSourceType = {
        name,
        icon,
        exUserId,
        label,
      };
      return infoObj;
    });
  }, [exSources]);
  const activeSourceList: ConnectSourceType[] = [];
  const liClassNameCallback = useCallback(
    (item: ConnectSourceType) => {
      let defaultClassName = 'networkItem';
      if ((activeCred || activeSourceName) && activeSource) {
        if (activeSource?.name !== item.name) {
          defaultClassName += ' disabled';
        }
      } else {
        if (activeSourceList.length > 0) {
          if (activeSourceList.includes(item.name) && !activeSource) {
            defaultClassName += ' excitable';
          } else {
            defaultClassName += ' disabled';
          }
        }
      }
      if (activeSource?.name === item.name) {
        defaultClassName += ' active';
      }
      return defaultClassName;
    },
    [activeSource, activeSourceList, activeCred, activeSourceName]
  );
  const handleClickData = (item: ConnectSourceType) => {
    if ((activeCred || activeSourceName) && activeSource) {
      if (activeSource?.name !== item.name) {
        return;
      }
    }
    if (
      (activeSourceList.length > 0 &&
        activeSourceList.includes(item.name) &&
        !activeSource) ||
      activeSourceList.length === 0
    ) {
      setActiveSource(item);
    }
  };
  return (
    <div className="connectedDataSourceList">
      {connectedSourceList.length > 0 && (
        <ul className="dataList">
          {connectedSourceList.map((item) => {
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
              </li>
            );
          })}
        </ul>
      )}
      {connectedSourceList.length === 0 && (
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
};
export default ConnectDataSourceList;