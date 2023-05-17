import React, { useState, useMemo } from 'react';
import '../AssetsOverview/index.sass';
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem'
import type { DataSourceItemList } from '@/components/DataSourceOverview/DataSourceList'
import SourcesStatisticsBar from '../SourcesStatisticsBar'
import TokenTable from '@/components/TokenTable'
import BigNumber from 'bignumber.js'
import { add, formatNumeral } from '@/utils/utils'
import PieChart from '../PieChart'
interface AssetsOverviewProps {
  filterSource: string | undefined;
  onClearFilter: () => void;
  list: DataSourceItemList;
}

const SocialOverview: React.FC<AssetsOverviewProps> = ({ filterSource,onClearFilter, list }) => {
  const [activeSourceName, setActiveSourceName] = useState<string>()
  const totalFollowers = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: DataSourceItemType) => BigNumber = (prev: BigNumber, curr: DataSourceItemType) => {
      const { followers } = curr
      return add(prev.toNumber(), (Number(followers)))
    }
    const bal = list.reduce(reduceF, new BigNumber(0))
    return `${bal.toFixed()}`
  }, [list])
  const totalFollowings = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: DataSourceItemType) => BigNumber = (prev: BigNumber, curr: DataSourceItemType) => {
      const { followings } = curr
      return add(prev.toNumber(), (Number(followings)))
    }
    const bal = list.reduce(reduceF, new BigNumber(0))
    return `${bal.toFixed()}`
  }, [list])
  const totalPosts = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: DataSourceItemType) => BigNumber = (prev: BigNumber, curr: DataSourceItemType) => {
      const { posts } = curr
      return add(prev.toNumber(), (Number(posts)))
    }
    const bal = list.reduce(reduceF, new BigNumber(0))
    return `${bal.toFixed()}`
  }, [list])
  const totalVerifiedAcct = useMemo(() => {
    const reduceF: (prev: number, curr: DataSourceItemType) => number = (prev: number, curr: DataSourceItemType) => {
      const { verified } = curr
      return verified ? prev + 1 : prev
    }
    const bal = list.reduce(reduceF, 0)
    return bal
  }, [list])

  
  const activeSourceTokenList = useMemo(() => {
    if (activeSourceName) {
      const activeS: DataSourceItemType[] = list.filter(
        (item) => item.name === activeSourceName
      ) as DataSourceItemType[];
      return activeS;
    } else {
      return list;
    }
  }, [list, activeSourceName]);

  const handleSelectSource = (sourceName: string | undefined) => {
    setActiveSourceName(sourceName)
  }
  const getChartData = useMemo(() => {
    const chartData = list.map(({ name, followers }) => ({ name, value: followers? new BigNumber(followers as number).toFixed(0): 0 }))
    return chartData
  }, [list])

  return (
    <div className="assetsOverview">
      <section className="statisticsWrapper">
        <div className="card cardL">
          <header>Overview</header>
          <div className="cardCon">
            <div className="descItem mainDescItem">
              <div className="label">Total Followers</div>
              <div className="value">{formatNumeral((totalFollowers as string), {transferUnit:false,decimalPlaces:0}) }</div>
            </div>
            <div className="descItemsWrapper">
              <div className="descItem">
                <div className="label">Total Following</div>
                <div className="value">
                  {formatNumeral((totalFollowings as string), {transferUnit:false,decimalPlaces:0}) }
                </div>
              </div>
              <div className="descItem">
                <div className="label">Total Posts</div>
                <div className="value">
                  {formatNumeral((totalPosts as string), {transferUnit:false,decimalPlaces:0}) }
                </div>
              </div>
              <div className="descItem">
                <div className="label">Acct. Tags</div>
                <div className="value">{totalVerifiedAcct}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card cardR">
          <header>Distribution</header>
          <div className="cardCon">
            <PieChart list={getChartData} />
          </div>
        </div>
      </section>
      <SourcesStatisticsBar list={list} onSelect={handleSelectSource} filterSource={filterSource} type="Social" onClearFilter={onClearFilter}/>
      <TokenTable list={activeSourceTokenList} type="Social" name={activeSourceName?.toLowerCase()}/>
    </div>
  );
};

export default SocialOverview;
