import React, { useState, useMemo } from 'react';
import '../AssetsOverview/index.sass';
import type { AssetsMap, DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem'
import type { DataSourceItemList } from '@/components/DataSourceOverview/DataSourceList'
import SourcesStatisticsBar from '../SourcesStatisticsBar'
import TokenTable from '@/components/TokenTable'
import BigNumber from 'bignumber.js'
import { add, mul } from '@/utils/utils'
import PieChart from '../PieChart'
import useSocialSources from '@/hooks/useSocialSources';
interface AssetsOverviewProps {
  filterSource: string | undefined
}

const SocialOverview: React.FC<AssetsOverviewProps> = ({ filterSource }) => {
  const [socialDatasMap, refreshSocialSources] = useSocialSources()
  const list = useMemo(() => {
    return socialDatasMap ? Object.values(socialDatasMap) : []
  }, [socialDatasMap])
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
  const handleSelectSource = (sourceName: string | undefined) => {
    setActiveSourceName(sourceName)
  }
  const getChartData = () => {
    const chartData = list.map(({ name, followers }) => ({ name, value: new BigNumber(followers as number).toFixed(0) }))
    return chartData
  }
  return (
    <div className="assetsOverview">
      <section className="statisticsWrapper">
        <div className="card cardL">
          <header>Overview</header>
          <div className="cardCon">
            <div className="descItem mainDescItem">
              <div className="label">Total Followering</div>
              <div className="value">{totalFollowers}</div>
            </div>
            <div className="descItemsWrapper">
              <div className="descItem">
                <div className="label">Total Posts</div>
                <div className="value">
                  {totalPosts}
                </div>
              </div>
              <div className="descItem">
                <div className="label">Total Likes</div>
                <div className="value">{totalFollowings}</div>
              </div>
              <div className="descItem">
                <div className="label">Verified Acct</div>
                <div className="value">{totalVerifiedAcct}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card cardR">
          <header>Distribution</header>
          <div className="cardCon">
            <PieChart list={getChartData()} />
          </div>
        </div>
      </section>
      <SourcesStatisticsBar list={list} onSelect={handleSelectSource} filterSource={filterSource} type="Social" />
      <TokenTable list={list} type="Social" />
    </div>
  );
};

export default SocialOverview;
