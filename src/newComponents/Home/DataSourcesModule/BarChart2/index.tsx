import React, { memo, useMemo, FC, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
import { EASInfo, SUPPORRTEDQUERYCHAINMAP } from '@/config/chain';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import { UserState } from '../../../../types/store';

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
  tokenMapDatas?: any[];
};

const MAXSHOWDATASOURCELEN = 4;
const PBarChart: FC<BarChartProps> = memo(
  ({ xDatas = [], yDatas = [], tokenMapDatas }) => {
    const { tokenIconFn } = useAssetsStatistic();
    console.log('2222xDatas', xDatas, yDatas); //delete
    const [colorMap, setColorMap] = useState<any>({
      borderChartColor: '#f4f4f4',
      xAxisLabelColor: '#6f6f6f',
      yAxisLabelColor: '#161616',
    });
    const theme = useSelector((state: UserState) => state.theme);
    const showXDatas = useMemo(() => {
      let l = [...xDatas];
      if (xDatas.length === 1) {
        const diffLen = MAXSHOWDATASOURCELEN - xDatas.length;
        for (var i = 0; i < diffLen; i++) {
          l.unshift({ name: '', icon: undefined });
        }
      }
      return l;
    }, [xDatas]);
    const showYDatas = useMemo(() => {
      let l = [...yDatas];
      if (yDatas.length === 1) {
        const diffLen = MAXSHOWDATASOURCELEN - yDatas.length;
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
            // width: 61,
            align: 'left',
            fontSize: 12,
            lineHeight: 16,
            fontFamily: 'IBM Plex Sans',
            color: colorMap.yAxisLabelColor,
            padding: [0, 0, 0, 4],
          },
        }
      );

      return m;
    }, [showXDatas, colorMap]);

    const tooltip = useMemo(() => {
      let obj: any = {
        formatter: (params) => {
          const { name, value } = params;

          return `${name}: $${formatNumeral(value)}`;
        },
      };
      if (tokenMapDatas) {
        obj = {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: 'rgba(0, 0, 0, 0)',
          padding: 0,
          renderMode: 'html',
          // className: 'echartsTooltip',
          formatter: (params) => {
            const { name, value, dataIndex } = params;
            console.log('222params', params, xDatas, tokenMapDatas, dataIndex); //delete
            const idx =
              showXDatas.length === MAXSHOWDATASOURCELEN
                ? MAXSHOWDATASOURCELEN - 1 - dataIndex
                : dataIndex;
            const currTokenList = tokenMapDatas[idx];
            const chainKey: any = Object.keys(SUPPORRTEDQUERYCHAINMAP).find(
              (i) =>
                SUPPORRTEDQUERYCHAINMAP[i].name.replace(/\s+/g, '') === name
            );

            console.log(
              '222formatter',
              EASInfo,
              SUPPORRTEDQUERYCHAINMAP,
              name,
              chainKey
            );

            const { icon } = SUPPORRTEDQUERYCHAINMAP[chainKey];
            let title = `<div class="tooltipTitle"><img src='${icon}'/><div>${SUPPORRTEDQUERYCHAINMAP[chainKey]?.name}</div></div>`;
            let desc = `<div class="tooltipDesc">Token Distribution</div>`;
            var list = currTokenList
              .map(function (item: any) {
                const { symbol, value } = item;
                const logoIcon = tokenIconFn(item);
                const showSymbol = symbol.split('---')[0];
                return `<li><div class="left"><img src='${logoIcon}'/><div>${showSymbol}</div></div><div class="right">$${formatNumeral(value)}</div></li>`;
              })
              .join('');

            return `<div class="tooltipWrapper">${title}${desc}<ul class="tokenUl">${list}</ul></div>`;
          },
        };
      }
      return obj;
    }, [tokenMapDatas]);
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
        tooltip,
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
            color: colorMap.xAxisLabelColor,
            // color: '#f4f4f4',
            formatter: function (value) {
              return (
                '$' +
                formatNumeral(value, { transferUnit: true, decimalPlaces: 0 })
              );
            },
          },
          splitLine: {
            lineStyle: {
              color: colorMap.borderChartColor,
            },
          },
        },
        yAxis: {
          type: 'category',
          data: showXDatas.map((i) => i.name),
          align: 'left',
          axisLabel: {
            color: colorMap.yAxisLabelColor,
            formatter: function (value) {
              // console.log('222value', value);
              if (value) {
                let formatName = value;
                if (tokenMapDatas) {
                  const chainKey: any = Object.keys(
                    SUPPORRTEDQUERYCHAINMAP
                  ).find(
                    (i) =>
                      SUPPORRTEDQUERYCHAINMAP[i].name.replace(/\s+/g, '') ===
                      value
                  );
                  formatName = SUPPORRTEDQUERYCHAINMAP[chainKey].name;
                }
                formatName = value === 'ArbitrumOne' ? 'Arbitrum' : formatName;

                return '{' + value + '| }{name|' + formatName + '}';
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
              color: colorMap.borderChartColor,
            },
          },
          splitLine: {
            show: false,
          },
        },
        series: {
          data: showYDatas,
          type: 'bar',
          barWidth: 32,
          itemStyle: {
            color: '#00C7F2',
          },
        },
      };
    }, [xRichDatasMap, showYDatas, showXDatas, tooltip, colorMap]);
    useEffect(() => {
      setColorMap(() => {
        // var mainColor = getComputedStyle(
        //   document.documentElement
        // ).getPropertyValue('--border-tokens-border-chart');
        // return mainColor;
        // --border-tokens-border-chart,--text-tokens-text-tertiary,--text-tokens-text-primary,
        if (theme === 'dark') {
          return {
            borderChartColor: '#262626',
            xAxisLabelColor: '#8d8d8d',
            yAxisLabelColor: '#f4f4f4',
          };
        } else {
          return {
            borderChartColor: '#f4f4f4',
            xAxisLabelColor: '#6f6f6f',
            yAxisLabelColor: '#161616',
          };
        }
      });
    }, [theme]);

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
  }
);
export default PBarChart;
