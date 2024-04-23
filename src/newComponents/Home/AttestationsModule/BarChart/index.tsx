import React, { memo, useMemo, FC } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
} from 'echarts/components';
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from 'echarts/renderers';
import { formatNumeral } from '@/utils/utils';
import { ATTESTATIONTYPEMAP } from '@/config/attestation';
import { EASInfo, SUPPORRTEDQUERYCHAINMAP } from '@/config/chain';
import './index.scss';

// Register the required components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  CanvasRenderer,
]);
type BarChartProps = {
  xDatas: any[];
  yDatas: any[];
};
const MAXSHOWDATASOURCELEN = 5;
const PBarChart: FC<BarChartProps> = memo(({ xDatas = [], yDatas = [] }) => {
  console.log('222chain-xDatas', xDatas, yDatas); //delete

  const showXDatas = useMemo(() => {
    let l = [...xDatas];
    const diffLen = MAXSHOWDATASOURCELEN - xDatas.length;
    for (var i = 0; i < diffLen; i++) {
      // l.unshift({ name: '', icon: undefined });
      l.push({});
    }
    return l;
  }, [xDatas]);
  const showYDatas = useMemo(() => {
    let l = [...yDatas];
    const diffLen = MAXSHOWDATASOURCELEN - yDatas.length;
    for (var i = 0; i < diffLen; i++) {
      l.push({});
    }
    return l;
  }, [yDatas]);

  const xRichDatasMap = useMemo(() => {
    return showXDatas.reduce((prev, curr) => {
      if (curr.name) {
        prev[curr.name] = {
          width: 24,
          height: 24,
          align: 'center',
          backgroundColor: {
            image: curr.icon,
          },
          fontSize: 0,
          padding: 0,
        };
      }
      return prev;
    }, {});
  }, [showXDatas]);
  const series = useMemo(() => {
    return showYDatas.map((i) => {
      const { name, data } = i;
      return {
        name,
        stack: 'a',
        type: 'bar',
        data,
        itemStyle: {
          color: name ? ATTESTATIONTYPEMAP[name].chartBarColor : '#fff',
          // borderRadius: [7, 7, 0, 0],
        },
        barWidth: 32,
      };
    });
  }, [showYDatas]);
  const option = useMemo(() => {
    return {
      grid: {
        y: '8px',
        y2: '84px',
        x: 0,
        x2: '36px',
      },
      legend: {
        bottom: 0,
        left: 0,
        padding: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 32,
        textStyle: {
          color: '#161616',
          fontFamily: 'IBM Plex Sans',
          fontSize: 12,
          lineHeight: 16,
          width: 107,
        },
        // itemStyle: {
        //   color: ''
        // }
      },
      animationDurationUpdate: 300,
      tooltip: {
        formatter: (params) => {
          const { name, value, seriesName } = params;
          const chainId =  Object.keys(EASInfo).find(
            (i) => i.replace(/\s+/g, '') === name
          );
          const CName = EASInfo[chainId].showName;
          // console.log('222params', params, CName);
          return `${seriesName}<br/>${CName}: ${value}`;
        },
      },
      xAxis: {
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        data: showXDatas.map((i) => i.name),
        axisLabel: {
          fontSize: 6,
          formatter: function (value, idx) {
            if (value) {
              return '{' + value + '| }';
            } else {
              return null;
            }
          },
          rich: xRichDatasMap,
        },
        type: 'category',
      },
      yAxis: {
        type: 'value',
        position: 'right',
        minInterval: 1,
        // maxInterval: 3,
        // interval: 3
      },
      series,
    };
  }, [series, xRichDatasMap]);

  return (
    <div className="pBarWrapper">
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
