import React, { useCallback, useEffect, useState, memo, useRef } from 'react';
// import the core library.
import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';
// Import charts, all with Chart suffix
import { PieChart } from 'echarts/charts';
// import components, all suffixed with Component
import {
  TooltipComponent,
  LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
} from 'echarts/components';
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from 'echarts/renderers';
import BigNumber from 'bignumber.js';

import { add, mul, div, gt, sub } from '@/utils/utils';
import type EChartsType  from 'echarts-for-react/lib/core';
import './index.sass';

// Register the required components
echarts.use([TooltipComponent, PieChart, LegendComponent, CanvasRenderer]);

type ChartDataType = {
  value: string;
  name: string;
};
interface PPieChartProps {
  list: ChartDataType[];
  others? :any
}
const CHARTCOLORS = [
  '#00CDFF',
  '#00F0DC',
  '#00D7C8',
  '#2864E1',
  '#335BEB',
  '#8741E1',
  '#D663D9',
  '#5DD8BA',
  '#6FD85D',
  '#BFD85D',
  '#EDC45A',
  '#ED8F5A',
];
const PPieChart: React.FC<PPieChartProps> = memo(({ list, others }) => {
  // console.log('PPieChart', list)
  const [options, setOptions] = useState({});
  const chartInstance = useRef<EChartsType>();

  // Obtain an instance of eccharts through a successful callback of loading the chart
  const onChartReady = useCallback((ref: EChartsType) => {
    chartInstance.current = ref;
  }, []);
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
      let cLeft = 8;
      let legendItemLabelWidth = 109; // 94
      let legendItemValueWidth = 71; // 88
      let legendItemValueFontSize = 20;
      let legendItemHeight = 27;
      let legendItemLeft = 263;
      let legendTop = others ? '32' : 'center';
      if (document.documentElement.getBoundingClientRect().width <= 1680) {
        legendTop = others ? '12' : 'center';
        innerRadius = 51.5; //56.5
        outerRadius = 75.5; //74.5
        cLeft = 12; // 26
        legendItemLabelWidth = 108; // 76
        legendItemValueWidth = 57; // 81
        legendItemValueFontSize = 16;
        legendItemHeight = 27;
        legendItemLeft = 209;
      }
    
      return {
        // color: CHARTCOLORS,
        tooltip: {
          trigger: 'item',
          // show: false
          valueFormatter: (value: string) =>
            '$' + new BigNumber(value).toFixed(2),
          formatter: '{b} : ${c} ({d}%)',
        },
        legend: {
          // type: 'scroll', //  Can be used when the number of legends is large
          // pageIconSize: 10,
          // pageButtonGap: 15,
          // pageIconSize: 15,
          // pageButtonGap: 32,
          top: legendTop,
          // right: legendItemRight,
          left: legendItemLeft,
          // backgroundColor: 'rgba(0, 0, 0, 0.05)',
          // borderRadius: '8px',
          orient: 'vertical',
          // padding: [4, 8],
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
                fontFamily: 'Inter-Medium',
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
              scaleSize: 8,
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
  // useEffect(() => {
  //   const fn = () => {
  //     chartInstance?.current?.resize();
  //   };
  //   window.addEventListener('resize', fn);
  //   return () => {
  //     window.removeEventListener('resize',fn);
  //   }
  // })

  const onEvents = {
    legendselectchanged: (params: any) => {
      // console.log('legendselectchanged', params, options);
      setOptions(getOption(params.name));
    },
  };
  //   const fn = (instance) => {
  // instance.resize()
  //   }
  return (
    <ReactEChartsCore
        echarts={echarts}
        option={options}
        notMerge={true}
        lazyUpdate={true}
        onEvents={onEvents}
        className="pPie"
        onChartReady={onChartReady}
      />
  );
});

export default PPieChart;
