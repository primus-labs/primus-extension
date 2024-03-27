import React, { memo, useMemo, FC } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components';
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import {
  CanvasRenderer,
  // SVGRenderer,
} from 'echarts/renderers';
import { formatNumeral } from '@/utils/utils';
import './index.scss';

// Register the required components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  CanvasRenderer,
  LegendComponent,
]);
type BarChartProps = {
  xDatas: any[];
  yDatas: any[];
};

const MAXSHOWDATASOURCELEN = 4;
const PBarChart: FC<BarChartProps> = memo(({ xDatas = [], yDatas = [] }) => {
  console.log('2222xDatas', xDatas, yDatas); //delete
  const showXDatas = useMemo(() => {
    let l = [...xDatas];
    if (xDatas.length < MAXSHOWDATASOURCELEN) {
      const diffLen = MAXSHOWDATASOURCELEN - xDatas.length;
      for (var i = 0; i < diffLen; i++) {
        l.unshift({ name: '', icon: undefined });
      }
    }
    return l;
  }, [xDatas]);
  const showYDatas = useMemo(() => {
    let l = [...yDatas];
    if (yDatas.length < MAXSHOWDATASOURCELEN) {
      const diffLen = MAXSHOWDATASOURCELEN - xDatas.length;
      for (var i = 0; i < diffLen; i++) {
        l.unshift('');
      }
    }
    return l;
  }, [yDatas]);
  const xRichDatasMap = useMemo(() => {
    let m = showXDatas.reduce(
      (prev, curr) => {
        if (curr.name) {
          prev[curr.name] = {
            width: 16,
            height: 16,
            // align: 'center',
            backgroundColor: {
              image: curr.icon,
            },
            // fontSize: 0,
          };
        }

        return prev;
      },
      {
        name: {
          width: 61,
          align: 'left',
          fontSize: 12,
          lineHeight: 16,
          fontFamily: 'IBM Plex Sans',
          color: '#161616',
        },
      }
    );

    return m;
  }, [showXDatas]);

  const option = useMemo(() => {
    return {
      grid: {
        y: '0',
        y2: '20px',
        x: '88px',
        x2: '14px',
      },
      legend: {},
      animationDurationUpdate: 300,
      tooltip: {
        formatter: (params) => {
          const { name, value } = params;
          return `${name}: $${formatNumeral(value)}`;
        },
      },
      xAxis: {
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        data: showXDatas,
        type: 'value',
        axisLabel: {
          fontSize: 10,
          lineHeight: 16,
          fontFamily: 'IBM Plex Sans',
          color: '#6F6F6F',
          formatter: function (value) {
            return (
              '$' +
              formatNumeral(value, { transferUnit: true, decimalPlaces: 0 })
            );
          },
        },
      },
      yAxis: {
        type: 'category',
        data: showXDatas.map((i) => i.name),
        align: 'left',
        axisLabel: {
          formatter: function (value) {
            console.log('222value', value);
            if (value) {
              return '{' + value + '| }{name|' + value + '}';
            } else {
              return '';
            }
          },
          rich: xRichDatasMap,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: '#E0E0E0',
          },
        },
        splitLine: {
          show: false,
        },
      },
      series: {
        data: showYDatas,
        type: 'bar',
        itemStyle: {
          color: '#00C7F2',
        },
      },
    };
  }, [xRichDatasMap, showYDatas, showXDatas]);

  return (
    <div className="pBar2Wrapper">
      <ReactEChartsCore
        echarts={echarts}
        notMerge={true}
        lazyUpdate={true}
        theme={'theme_name'}
        option={option}
        className="pBar"
      />
    </div>
  );
});
export default PBarChart;
