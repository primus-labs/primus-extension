import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { formatNumeral, sub, formatAddress } from '@/utils/utils';
import type {
  SocialDataList,
  SocialData,
  ExDataList,
  SourceDataList,
} from '@/types/dataSource';

import './index.sass';

interface SourcesStatisticsBarProps {
  type?: string;
  list: SourceDataList;
  filterSource: string | undefined;
  onSelect: (sourceName: string | undefined) => void;
  onClearFilter: () => void;
}

const SourcesStatisticsBar: React.FC<SourcesStatisticsBarProps> = memo(
  ({ type = 'Assets', list, filterSource, onSelect, onClearFilter }) => {
    console.log('SourcesStatisticsBar', list, filterSource);
    const [activeSourceName, setActiveSourceName] = useState<string>();

    const activeList = useMemo(() => {
      let activeL = list;
      if (type === 'Assets') {
        activeL = (list as ExDataList).sort((a, b) =>
          sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
        );
      } else if (type === 'Social') {
        activeL = (list as SocialDataList).sort((a, b) =>
          sub(Number(b.followers), Number(a.followers)).toNumber()
        );
      }
      return activeL;
    }, [list, type]);

    // useEffect(() => {
    //   console.log('activeList', activeList)
    // }, [activeList])
    const handleClickSource = (sourceName: string, address?: string) => {
      // Click to activate and then click to deactivate
      let formatSourceName = sourceName;

      if (sourceName === 'On-chain Assets') {
        const formatAddr = formatAddress(address as string, 4, 4);
        formatSourceName = formatAddr;
      }
      if (formatSourceName === activeSourceName) {
        setActiveSourceName(undefined);
        onClearFilter();
      } else {
        setActiveSourceName(formatSourceName as string);
      }
    };
    const sourceCoreDataFn = (item: any) => {
      let formatNum;
      if (type === 'Social') {
        // if (sourceLowerName === 'discord') {
        //   formatNum = formatNumeral((item.followings as string), {transferUnit:false,decimalPlaces:0})
        // } else {
        if (item.followers === null) {
          formatNum = formatNumeral(item.followings as string, {
            transferUnit: false,
            decimalPlaces: 0,
          });
        } else {
          formatNum = formatNumeral(item.followers as string, {
            transferUnit: false,
            decimalPlaces: 0,
          });
        }
        // }
      } else {
        formatNum = '$' + formatNumeral(item.totalBalance as string);
      }
      return formatNum;
    };

    const liClassNameFn = (name: string, address: string) => {
      let activeClassName = 'source';
      if (type === 'Social') {
        activeClassName += ' social';
      }

      let formatName = name;
      if (name === 'On-chain Assets') {
        const formatAddr = formatAddress(address as string, 4, 4);
        formatName = formatAddr;
      }
      if (!!activeSourceName && activeSourceName !== formatName) {
        activeClassName += ' disabled';
      }
      return activeClassName;
    };

    useEffect(() => {
      onSelect(activeSourceName);
    }, [activeSourceName, onSelect]);
    useEffect(() => {
      if (filterSource) {
        const lowerFilterWord = filterSource?.toLowerCase();
        const filterList = [
          ...list.filter((item) => {
            const lowerCaseName = item.name.toLowerCase();
            return lowerCaseName.startsWith(lowerFilterWord as string);
          }),
        ];
        console.log('filterSource', filterSource, filterList);
        // TODO what if filter several sources
        setActiveSourceName(filterList[0]?.name ?? undefined);
      } else {
        if (filterSource !== null && filterSource !== undefined) {
          setActiveSourceName(undefined);
        }
      }
    }, [filterSource]);
    const fromNameFn = useCallback((item) => {
      if (item.name === 'On-chain Assets') {
        const formatAddr = formatAddress(item.address as string, 4, 4);
        return formatAddr;
      }
      return item.name;
    }, []);

    return (
      <section className="sourcesStatisticsBar">
        <header>Sources</header>
        <ul className={type === 'Social' ? 'sources social' : 'sources'}>
          {activeList.map((item) => {
            return (
              <li
                className={liClassNameFn(item.name, item.address)}
                key={item.name}
                onClick={() => handleClickSource(item.name, item.address)}
              >
                <div className="label">from {fromNameFn(item)}</div>
                <div className="value">
                  <img src={item.icon} alt="" />
                  <span>{sourceCoreDataFn(item)}</span>
                </div>
                {type === 'Social' && (
                  <div className="tip">
                    {(item as SocialData).followers === null
                      ? 'Following'
                      : 'Followers'}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }
);

export default SourcesStatisticsBar;
