import React, { useRef, useCallback, useEffect, useState } from 'react';
// import the core library.
import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';
// Import charts, all with Chart suffix
import { PieChart } from 'echarts/charts';
import BigNumber from 'bignumber.js'
import { add, mul, div } from '@/utils/utils'
import { CHARTCOLORS } from '@/utils/constants'
// import components, all suffixed with Component
import {
  TooltipComponent,
  LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
} from 'echarts/components';
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import {
  CanvasRenderer,
} from 'echarts/renderers';

// Register the required components
echarts.use([TooltipComponent, PieChart, LegendComponent, CanvasRenderer]);

type ChartDataType = {
  value: string;
  name: string;
}
interface PPieChartProps {
  list: ChartDataType[]
}
const PPieChart: React.FC<PPieChartProps> = ({ list }) => {
  const [options, setOptions] = useState({})
  const getOption = useCallback((name?: string) => {
    const chartData = list
    const allSelected = list.reduce((prev, curr) => {
      const { name } = curr
      return { ...prev, [name]: true }
    }, {})
    const legendData = name ? list.map(i => i.name === name ? ({ name: i.name, textStyle: { backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: 8 } }) : ({ name: i.name })) : Object.keys(allSelected)
    console.log('legendData', name, legendData)
    const reduceF = (prev: BigNumber, curr: ChartDataType) => {
      const { value } = curr
      return add(prev.toNumber(), (Number(value)))
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
        right: 41,
        // backgroundColor: 'rgba(0, 0, 0, 0.05)',
        // borderRadius: '8px',
        orient: 'vertical',
        padding: [6, 12],
        itemGap: 0,
        icon: 'circle',
        itemWidth: 14,
        itemHeight: 14,
        selected: allSelected,
        // selectedMode: false,
        formatter: (name: string) => {
          const val = (list.find((i) => i.name === name) as ChartDataType).value
          const percent = mul(Number(div(Number(val), Number(totalBal))), 100).toFixed(2) + '%'
          return [`{name|${name}}`, `{value|${percent}}`].join(' ')
        },
        textStyle: {
          width: 191,
          height: 41,
          rich: {
            name: {
              fontFamily: 'Inter-Medium',
              color: 'rgba(0,0,0,0.6)',
              fontSize: 14,
              height: 41,
              lineHeight: 41,
              width: 94
            },
            value: {
              fontFamily: 'Inter-Bold',
              color: 'rgb(0,0,0)',
              fontSize: 24,
              height: 41,
              lineHeight: 41,
              width: 53
            }
          }
        },
        data: legendData
      },
      series: [
        {
          type: 'pie',
          radius: [60, 83.5],
          top: 'middle',
          left: 36.5,
          width: 167,
          height: 167,
          // radius: [60, 92],
          // top: 'middle',
          // left: 28,
          // width: 184,
          // height: 184,
          // selectedOffset: 50,
          startAngle: 135,
          minAngle: 5,
          legendHoverLink: true,
          // avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            scaleSize: 11,
            label: {
              show: false,
            }
          },
          labelLine: {
            show: false
          },
          data: chartData,
          // animation: false
        }
      ]
    }
  }, [list])
  useEffect(() => {
    setOptions(getOption())
  }, [list, getOption])

  const onEvents = {
    'legendselectchanged': (params: any) => {
      console.log('legendselectchanged', params, options);
      setOptions(getOption(params.name))
    }
  }
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={options}
      notMerge={true}
      lazyUpdate={true}
      onEvents={onEvents}
    />
  );
};

export default PPieChart;
