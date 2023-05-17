import React, { useState, useEffect, memo, useMemo } from 'react';
import type { DataSourceItemList } from '@/components/DataSourceOverview/DataSourceList'
import { formatNumeral, sub } from '@/utils/utils'
import './index.sass';

interface SourcesStatisticsBarProps {
  type?: string;
  list: DataSourceItemList,
  filterSource: string | undefined,
  onSelect: (sourceName: string | undefined) => void;
  onClearFilter: () => void
}

const SourcesStatisticsBar: React.FC<SourcesStatisticsBarProps> = memo(({ type = 'Assets', list, filterSource, onSelect,onClearFilter }) => {
  const [activeSourceName, setActiveSourceName] = useState<string>()
  const activeList = useMemo(() => {
    const activeL = list.sort((a,b) => sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber())
    return activeL
  },[list])
  const handleClickSource = (sourceName: string) => {
    // Click to activate and then click to deactivate
    // const targetName = sourceName === activeSourceName ? undefined : sourceName
    // setActiveSourceName(targetName)
    if(sourceName === activeSourceName) {
      setActiveSourceName(undefined)
      onClearFilter()
    } else {
      setActiveSourceName(sourceName)
    }
  }
  const sourceCoreDataFn = (item:any) => {
    const sourceLowerName = item.name.toLowerCase()
    let formatNum;
    if (type === 'Social') {
      // if (sourceLowerName === 'discord') {
      //   formatNum = formatNumeral((item.followings as string), {transferUnit:false,decimalPlaces:0}) 
      // } else {
        if (item.followers === null) {
          formatNum = formatNumeral((item.followings as string), {transferUnit:false,decimalPlaces:0}) 
        } else {
          formatNum = formatNumeral((item.followers as string), {transferUnit:false,decimalPlaces:0}) 
        }
      // }
    } else {
      formatNum = '$' + formatNumeral(item.totalBalance as string)
    }
    return formatNum
  }
  useEffect(() => {
    onSelect(activeSourceName)
  }, [activeSourceName])
  useEffect(() => {
    if (filterSource) {
      const lowerFilterWord = filterSource?.toLowerCase()
      const filterList = [...list.filter(item => {
        const lowerCaseName = item.name.toLowerCase()
        return lowerCaseName.startsWith(lowerFilterWord as string)
      })]
      console.log('filterSource', filterSource, filterList);
      // TODO what if filter several sources
      setActiveSourceName(filterList[0]?.name ?? undefined)
    } else {
      if (filterSource !==null && filterSource !==undefined) {
        setActiveSourceName(undefined)
      }
    }
  }, [filterSource])
  return (
    <section className="sourcesStatisticsBar">
      <header>Sources</header>
      <ul className={(type === 'Social' ? "sources social" : "sources")}>
        {activeList.map(item => {
          return <li className={
            ((!!activeSourceName  && activeSourceName=== item.name) || !activeSourceName)? 
            (type === 'Social' ? "source social" : "source"): 
            (type === 'Social' ? "source social disabled" : "source disabled")} 
            key={item.name} onClick={() => handleClickSource(item.name)}>
            <div className="label">Data on {item.name}</div>
            <div className="value">
              <img src={item.icon} alt="" />
              <span>{sourceCoreDataFn(item)}</span>
            </div>
            {type === 'Social' && <div className="tip">{item.followers === null? 'Following': 'Followers'}</div>}
          </li>
        })}
      </ul>
    </section>
  );
});

export default SourcesStatisticsBar;
