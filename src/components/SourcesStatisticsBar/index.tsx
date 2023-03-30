import React, { useState, useEffect } from 'react';
import type { DataSourceItemList } from '@/components/DataSourceList'
import { formatUD } from '@/utils/utils'
import './index.sass';

interface SourcesStatisticsBarProps {
  list: DataSourceItemList,
  filterSource: string | undefined,
  onSelect: (sourceName: string | undefined) => void
}

const SourcesStatisticsBar: React.FC<SourcesStatisticsBarProps> = ({ list, filterSource, onSelect }) => {
  console.log('SourcesStatisticsBar-list', list)
  const [activeSourceName, setActiveSourceName] = useState<string>()
  const handleClickSource = (sourceName: string) => {
    // Click to activate and then click to deactivate
    const targetName = sourceName === activeSourceName ? undefined : sourceName
    setActiveSourceName(targetName)
  }
  useEffect(() => {
    onSelect(activeSourceName)
  }, [activeSourceName, onSelect])
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
      setActiveSourceName(undefined)
    }
  }, [filterSource, list, setActiveSourceName, onSelect])
  return (
    <section className="sourcesStatisticsBar">
      <header>Sources</header>
      <ul className="sources">
        {list.map(item => {
          return <li className="source" key={item.name} onClick={() => handleClickSource(item.name)}>
            <div className="label">Data on {item.name}</div>
            <div className="value">
              <img src={item.icon} alt="" />
              <span>{formatUD(item.totalBalance)}</span>
            </div>
          </li>
        })}
      </ul>
    </section>
  );
};

export default SourcesStatisticsBar;
