import React, { useCallback, useEffect, useState, memo } from 'react';
// import the core library.
import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';
// Import charts, all with Chart suffix
import { PieChart } from 'echarts/charts';
import BigNumber from 'bignumber.js';
import { add, mul, div, gt, sub } from '@/utils/utils';
import { CHARTCOLORS } from '@/config/constants';
// import components, all suffixed with Component
import {
  TooltipComponent,
  LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
} from 'echarts/components';
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from 'echarts/renderers';
import './index.sass';
// Register the required components
echarts.use([TooltipComponent, PieChart, LegendComponent, CanvasRenderer]);

type ChartDataType = {
  value: string;
  name: string;
};
interface PPieChartProps {
  list: ChartDataType[];
}
const PPieChart: React.FC<PPieChartProps> = memo(({ list }) => {
  // console.log('PPieChart', list)
  const [options, setOptions] = useState({});
  const getOption = useCallback(
    (name?: string) => {
      const chartData = list
        .sort((a, b) => sub(Number(b.value), Number(a.value)).toNumber())
        .map((i, k) => {
          return {
            ...i,
            itemStyle: {
              normal: { color: CHARTCOLORS[k] },
              emphasis: { color: CHARTCOLORS[k] },
            },
          };
        });
      const allSelected = list.reduce((prev, curr) => {
        const { name } = curr;
        return { ...prev, [name]: true };
      }, {});
      const legendData = name
        ? list.map((i) =>
            i.name === name
              ? {
                  name: i.name,
                  textStyle: {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 8,
                  },
                }
              : { name: i.name }
          )
        : Object.keys(allSelected);
      // console.log('legendData', name, legendData)
      const reduceF = (prev: BigNumber, curr: ChartDataType) => {
        const { value } = curr;
        return add(prev.toNumber(), Number(value));
      };
      const totalBal = list.reduce(reduceF, new BigNumber(0));
      let innerRadius = 60;
      let outerRadius = 82;
      let cLeft = 28;
      let legendItemLabelWidth = 94;
      let legendItemValueWidth = 88;
      let legendItemValueFontSize = 24;
      let legendItemHeight = 41;
      let legendItemRight = 6;
      if (document.documentElement.getBoundingClientRect().width < 1680) {
        innerRadius = 53.5;
        outerRadius = 82.5;
        cLeft = 14;
        legendItemLabelWidth = 76;
        legendItemValueWidth = 81;
        legendItemValueFontSize = 20;
        legendItemHeight = 36;
        legendItemRight = 9;
      }
      return {
        // color: CHARTCOLORS,
        tooltip: {
          trigger: 'item',
          // show: false
          valueFormatter: (value: string) =>
            '$' + new BigNumber(value).toFixed(2),
          formatter: '{b} : {c} ({d}%)',
        },
        legend: {
          type: 'scroll', //  Can be used when the number of legends is large
          pageIconSize: 10,
          pageButtonGap: 15,
          // pageIconSize: 15,
          // pageButtonGap: 32,
          top: 'center',
          right: legendItemRight,
          // backgroundColor: 'rgba(0, 0, 0, 0.05)',
          // borderRadius: '8px',
          orient: 'vertical',
          padding: [6, 12],
          itemGap: 0,
          icon: 'circle',
          itemWidth: 14,
          itemHeight: 14,
          itemStyle: {
            borderWidth: 0,
          },
          selected: allSelected,
          // selectedMode: false,
          formatter: (name: string) => {
            const val = (list.find((i) => i.name === name) as ChartDataType)
              .value;
            let percent = '0%';
            if (gt(Number(totalBal), 0)) {
              percent =
                mul(Number(div(Number(val), Number(totalBal))), 100).toFixed(
                  2
                ) + '%';
            }
            return [`{name|${name}}`, `{value|${percent}}`].join(' ');
          },
          textStyle: {
            // width: 191,
            // height: 41,
            rich: {
              name: {
                fontFamily: 'Inter-Medium',
                color: 'rgba(0,0,0,0.6)',
                fontSize: 14,
                height: legendItemHeight,
                lineHeight: legendItemHeight,
                width: legendItemLabelWidth,
              },
              value: {
                fontFamily: 'Inter-SemiBold',
                color: 'rgb(0,0,0)',
                fontSize: legendItemValueFontSize,
                height: legendItemHeight,
                lineHeight: legendItemHeight,
                width: legendItemValueWidth,
              },
            },
          },
          data: legendData,
        },
        series: [
          {
            type: 'pie',
            radius: [innerRadius, outerRadius],
            top: 'middle',
            left: cLeft,
            width: outerRadius * 2,
            height: outerRadius * 2,
            startAngle: 135,
            minAngle: 5,
            legendHoverLink: true,
            // avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 0,
              borderColor: '#f0fbfb',
              borderWidth: 3,
            },
            label: {
              show: false,
              position: 'center',
            },
            emphasis: {
              scaleSize: 11,
              label: {
                show: false,
              },
            },
            labelLine: {
              show: false,
            },
            data: chartData,
            // animation: false
          },
        ],
      };
    },
    [list]
  );
  useEffect(() => {
    setOptions(getOption());
  }, [list, getOption]);

  const onEvents = {
    legendselectchanged: (params: any) => {
      // console.log('legendselectchanged', params, options);
      setOptions(getOption(params.name));
    },
  };
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={options}
      notMerge={true}
      lazyUpdate={true}
      onEvents={onEvents}
      className="pPie"
    />
  );
});

export default PPieChart;
