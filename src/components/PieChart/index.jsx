import React, { useRef, useEffect, useCallback } from 'react';
// import ReactEcharts from 'echarts-for-react'

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
import {
  CanvasRenderer,
} from 'echarts/renderers';

// Register the required components
echarts.use([TooltipComponent, PieChart, LegendComponent, CanvasRenderer]);

const PPieChart = (props) => {
  const { option } = props;
  const chartInstance = useRef(null);
  // useEffect(() => {
  //   const mc = document.getElementById('mchart')
  //   console.log('mc', mc)
  //   mc.on('legendselectchanged', function (params) {
  //     console.log(params);
  //   });
  //   // if(mc.current) {
  //   //   mc.current.on('legendselectchanged', function (params) {
  //   //     console.log(params);
  //   //   });
  //   // }
  // }, [])

  // 绑定事件
  const bind = useCallback((ref) => {
    if (!ref) return;
    // ref.on('click', params => {
    //   // do sth...
    //   console.log('params', params);
    // });
    ref.on('legendselectchanged', function (params) {
      console.log('legendselectchanged', params);
      // ref.dispatchAction({
      //   type: 'highlight',
      //   // 可选，数据项名称，在有 dataIndex 的时候忽略
      //   // name: params.name,
      //   name: 'OKX',
      // })
    });
  }, []);

  // 通过加载图表成功的回调获取 echarts 实例
  const onChartReady = useCallback(
    (ref) => {
      chartInstance.current = ref;
      bind(ref);
    },
    [bind]
  );
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge={true}
      lazyUpdate={true}
      onChartReady={onChartReady}
    />
  );
  // return <ReactEcharts id="mchart"  className="widthPx-700" style={{ height: '315px' }} option={option} onChartReady={onChartReady}/>
};

export default PPieChart;
