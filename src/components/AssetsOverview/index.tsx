import React, { useState, useMemo } from 'react';
import iconRefresh from '@/assets/img/iconRefresh.svg';
import './index.sass';
import type { AssetsMap, DataSourceItemType } from '@/components/DataSourceItem'
import type { DataSourceItemList } from '@/components/DataSourceList'
import SourcesStatisticsBar from '@/components/SourcesStatisticsBar'
import TokenTable from '@/components/TokenTable'
import BigNumber from 'bignumber.js'
import { add, mul } from '@/utils/utils'
import PieChart from '@/components/PieChart'

interface AssetsOverviewProps {
  list: DataSourceItemList,
  filterSource: string | undefined
}

const AssetsOverview: React.FC<AssetsOverviewProps> = ({ list, filterSource }) => {
  console.log('AssetsOverview-list', list);
  const [activeSourceName, setActiveSourceName] = useState<string>()
  const totalAssetsBalance = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: DataSourceItemType) => BigNumber = (prev: BigNumber, curr: DataSourceItemType) => {
      const { totalBalance } = curr
      return add(prev.toNumber(), (Number(totalBalance)))
    }
    const bal = list.reduce(reduceF, new BigNumber(0))
    return `$${bal.toFixed(2)}`
  }, [list])

  const totalAssetsMap = useMemo(() => {
    const reduceF: (prev: AssetsMap, curr: DataSourceItemType) => AssetsMap = (prev, curr) => {
      const { tokenListMap } = curr
      Object.keys(tokenListMap).forEach(symbol => {
        if (symbol in prev) {
          const { amount: prevAmount, price } = prev[symbol]
          const { amount } = tokenListMap[symbol]
          const totalAmount = add(Number(prevAmount), Number(amount)).toFixed()
          const totalValue = mul(Number(totalAmount), Number(price)).toFixed()
          prev[symbol] = {
            symbol,
            price,
            amount: totalAmount,
            value: totalValue
          }
        } else {
          prev = {
            ...prev,
            [symbol]: {
              ...tokenListMap[symbol]
            }
          }
        }
      })
      return prev
    }
    const totalTokenMap = list.reduce(reduceF, {})
    return totalTokenMap
  }, [list])
  const totalAssetsNo = useMemo(() => {
    return Object.keys(totalAssetsMap).length
  }, [totalAssetsMap])
  const activeAssetsMap = useMemo(() => {
    if (activeSourceName) {
      const activeS: DataSourceItemType = (list.find(item => item.name === activeSourceName)) as DataSourceItemType
      return activeS.tokenListMap
    } else {
      return totalAssetsMap
    }
  }, [list, activeSourceName, totalAssetsMap,])
  const activeSourceTokenList = useMemo(() => {
    return Object.values(activeAssetsMap)
  }, [activeAssetsMap])

  const handleSelectSource = (sourceName: string | undefined) => {
    setActiveSourceName(sourceName)
  }
  const getChartData = () => {
    const chartData = list.map(({ name, totalBalance }) => ({ name, value: new BigNumber(totalBalance).toFixed(2) }))
    return chartData
  }
  return (
    <div className="assetsOverview">
      <header className="updateBtn">
        <img src={iconRefresh} alt="" />
        <span>Data Update</span>
      </header>
      <section className="statisticsWrapper">
        <div className="card cardL">
          <header>Overview</header>
          <div className="cardCon">
            <div className="descItem mainDescItem">
              <div className="label">Total Balance</div>
              <div className="value">{totalAssetsBalance}</div>
            </div>
            <div className="descItemsWrapper">
              <div className="descItem">
                <div className="label">PnL</div>
                {/* TODO */}
                <div className="value">
                  <span>-</span>
                  {/* <div className="percent raise fall">-1.29%</div> */}
                </div>
              </div>
              <div className="descItem">
                <div className="label">Assets No.</div>
                <div className="value">{totalAssetsNo}</div>
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
      <SourcesStatisticsBar list={list} onSelect={handleSelectSource} filterSource={filterSource} />
      <TokenTable list={activeSourceTokenList} />
    </div>
  );
};

export default AssetsOverview;
