import React, { FC, useMemo, useCallback, useState, useEffect } from 'react';
import type { ConnectSourceType } from '@/types/dataSource';
import { useSelector, useDispatch } from 'react-redux';
import type { UserState } from '@/types/store';
import type { ExchangeMeta } from '@/types/config';
import { DATASOURCEMAP } from '@/config/constants';
import type { CredTypeItemType } from '@/types/cred';
import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import './index.sass';
interface ConnectDataSourceListProps {
  mutiple?: boolean;
  onChange: (source: ConnectSourceType | ConnectSourceType[] | undefined) => void;
}
const ConnectDataSourceList: FC<ConnectDataSourceListProps> = ({
  mutiple = false,
  onChange,
}) => {
  const [activeSource, setActiveSource] = useState<ConnectSourceType>();
  const [activeSources, setActiveSources] = useState<ConnectSourceType[]>([]);

  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);
  
  const connectedSourceList: ConnectSourceType[] = useMemo(() => {
    const exArr = Object.keys(exSources).map((key) => {
      const sourceInfo: ExchangeMeta =
        DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
      const { name, icon,type } = sourceInfo;
      const { exUserId, label } = exSources[key];
      const infoObj: ConnectSourceType = {
        name,
        icon,
        exUserId,
        label,
        type,
      };
      return infoObj;
    });
    const socialArr = Object.keys(socialSources).map((key) => {
      const sourceInfo: ExchangeMeta =
        DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
      const { name, icon,type } = sourceInfo;
      const { exUserId, label } = socialSources[key];
      const infoObj: ConnectSourceType = {
        name,
        icon,
        exUserId,
        label,
        type,
      };
      return infoObj;
    });
    return [...exArr,...socialArr];
  }, [exSources, socialSources]);
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

  const handleClickData = (item: ConnectSourceType) => {
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

  useEffect(() => {
    if (mutiple) {
      onChange(activeSources);
    } else {
      onChange(activeSource);
    }
  }, [activeSource, mutiple, activeSources, onChange]);

  return (
    <div className="connectedDataSourceList scroll">
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
