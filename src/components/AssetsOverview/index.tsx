import React, { useState, useMemo } from 'react';
import iconRefresh from '@/assets/img/iconRefresh.svg';
import './index.sass';
import type { AssetsMap, DataSourceItemType } from '@/components/DataSourceItem'
import type { DataSourceItemList } from '@/components/DataSourceList'
import SourcesStatisticsBar from '@/components/SourcesStatisticsBar'
import TokenTable from '@/components/TokenTable'
import BigNumber from 'bignumber.js'
import { add, mul, div } from '@/utils/utils'
import PieChart from '@/components/PieChart'
import { CHARTCOLORS } from '@/utils/constants'
interface AssetsOverviewProps {
  list: DataSourceItemList,
  filterSource: string | undefined
}
type ChartDataType = {
  value: string;
  name: string;
}
type ChartDatas = ChartDataType[]
const AssetsOverview: React.FC<AssetsOverviewProps> = ({ list, filterSource }) => {
  const [activeSourceName, setActiveSourceName] = useState<string>()
  const totalAssetsBalance = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: DataSourceItemType) => BigNumber = (prev: BigNumber, curr: DataSourceItemType) => {
      const { totalBalance } = curr
      return add(prev.toNumber(), (Number(totalBalance)))
    }
    const bal = list.reduce(reduceF, new BigNumber(0))
    return `$${bal.toFixed(2)}`
  }, [list])
  const totalAssetsNo = useMemo(() => {
    const reduceF: (prev: number, curr: DataSourceItemType) => number = (prev, curr) => {
      const { assetsNo } = curr
      return add(prev, assetsNo).toNumber()
    }
    const num = list.reduce(reduceF, 0)
    return num
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
  const getOption = () => {
    const chartData: ChartDatas = list.map(({ name, totalBalance }) => ({ name, value: new BigNumber(totalBalance).toFixed(2) }))
    console.log('chartData', chartData)
    const reduceF: (prev: BigNumber, curr: DataSourceItemType) => BigNumber = (prev: BigNumber, curr: DataSourceItemType) => {
      const { totalBalance } = curr
      return add(prev.toNumber(), (Number(totalBalance)))
    }
    const totalBal = list.reduce(reduceF, new BigNumber(0))
    return {
      color: CHARTCOLORS,
      tooltip: {
        trigger: 'item',
        // show: false
        valueFormatter: (value: string) => '$' + new BigNumber(value).toFixed(2),
        formatter: "{b} : {c} ({d}%)"
      },
      legend: {
        // type: 'scroll',//  Can be used when the number of legends is large
        top: 'center',
        left: 324,
        width: 191,
        // backgroundColor: 'rgba(0, 0, 0, 0.05)',
        // borderRadius: '8px',
        orient: 'vertical',
        padding: [6, 12],
        // itemGap: 0,
        icon: 'circle',
        itemWidth: 14,
        itemHeight: 14,
        selected: {
          'KuCoin': true
        },
        // selectedMode: false,
        formatter: (name: string) => {
          // 只接受一个参数，即类目名称
          // const formatName = name
          const val = (chartData.find((i) => i.name === name) as ChartDataType).value
          // name|value|为样式标记符，用于在符文笨重设置对应样式
          const percent = mul(Number(div(Number(val), Number(totalBal))), 100).toFixed(2) + '%'
          // return [`{name|${name}}`, `{value|${percent}}`].join('\n')
          return [`{name|${name}}`, `{value|${percent}}`].join(' ')
        },
        textStyle: {
          rich: {
            name: {
              fontFamily: 'Inter-Medium',
              color: 'rgba(0,0,0,0.6)',
              fontSize: 14,
              lineHeight: 41,
              // padding: [0, 0, 27, 0]
              // display: "inline-block"
              justifyContent: 'flex-start'
            },
            value: {
              fontFamily: 'Inter-Bold',
              color: 'rgb(0,0,0)',
              fontSize: 24,
              lineHeight: 41,
              // padding: [0, 0, 27, 0]
              // display: "inline-block"
              justifyContent: 'flex-end',
              textAlign: 'right'
            }
          }
        }
      },
      series: [
        {
          type: 'pie',
          // radius: [60, 92],
          // center: [100, 145], // 设置饼图圆心
          // width: 184,
          // height: 184,
          radius: [60, 83.5],
          top: 'middle',
          left: 18.5,
          width: 167,
          height: 167,
          // selectedOffset: 50,
          startAngle: 135,
          minAngle: 10,
          legendHoverLink: true,
          // avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            scaleSize: 8.5,
            label: {
              show: false,
            }
          },
          labelLine: {
            show: false
          },
          data: chartData
        }
      ]
    }
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
            <PieChart option={getOption()} />
          </div>
        </div>
      </section>
      <SourcesStatisticsBar list={list} onSelect={handleSelectSource} filterSource={filterSource} />
      <TokenTable list={activeSourceTokenList} />
    </div>
  );
};

export default AssetsOverview;
