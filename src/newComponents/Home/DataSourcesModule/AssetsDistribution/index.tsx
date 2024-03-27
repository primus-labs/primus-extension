import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import Chart from 'react-apexcharts';
import { sub, add, div, mul, formatNumeral } from '@/utils/utils';

import { setActiveConnectDataSource } from '@/store/actions';
import './index.scss';
import AssetsBalance from '@/newComponents/AssetsBalance';
import PButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import useAllSources from '@/hooks/useAllSources';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
const MAXSHOWTOKENLEN = 5;
const MAXSHOWDATASOURCELEN = 4;
const tList = [
  { label: 'Portfolio', value: 'Portfolio' },
  { label: 'Token', value: 'Token' },
  { label: 'Chain', value: 'Chain' },
];
const Overview = memo(() => {
  const {
    sortedHoldingTokensList,
    balancePercentFn,
    tokenIconFn,
    sortedChainAssetsList,
  } = useAssetsStatistic();
  const { sortedConnectedAssetsSourcesList } = useAllSources();
  console.log(
    '222',
    sortedConnectedAssetsSourcesList,
    sortedHoldingTokensList,
    sortedChainAssetsList
  ); //delete
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Portfolio');
  const handleMore = useCallback(() => {
    navigate('/datas');
  }, [navigate]);

  const barChartBaseOptions = useMemo(() => {
    return {
      chart: {
        type: 'bar',
        // height: 236,
      },
      plotOptions: {
        bar: {
          // borderRadius: 4,
          horizontal: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: [],
      },
    };
  }, []);
  const showPortfolioList = useMemo(() => {
    const allList = sortedConnectedAssetsSourcesList;
    if (allList.length > MAXSHOWDATASOURCELEN) {
      const prevL = allList.slice(0, MAXSHOWDATASOURCELEN - 1);
      const otherL = allList.slice(MAXSHOWDATASOURCELEN - 1);
      const reduceF: (prev: BigNumber, curr: any) => BigNumber = (
        prev,
        curr
      ) => {
        const { totalBalance } = curr;
        return add(prev.toNumber(), Number(totalBalance));
      };
      let otherTotalBal = otherL.reduce(reduceF, new BigNumber(0));
      otherTotalBal = `${otherTotalBal.toFixed(2)}`;
      return [
        ...prevL,
        { id: 'Other', name: 'Other', totalBalance: otherTotalBal },
      ];
    } else {
      return allList;
    }
  }, [sortedConnectedAssetsSourcesList]);
  const optionsPortfolio = useMemo(() => {
    const l = showPortfolioList.map((i) => i.name);
    const fullOptions = { ...barChartBaseOptions };
    fullOptions.xaxis = { categories: l };
    return fullOptions;
  }, [sortedConnectedAssetsSourcesList, barChartBaseOptions]);
  const seriesPortfolio = useMemo(() => {
    const l = showPortfolioList.map((i) => i.totalBalance - 0);
    return [
      {
        data: l,
      },
    ];
  }, [sortedConnectedAssetsSourcesList]);
  const optionsToken = useMemo(() => {
    return {
      chart: {
        height: '100%',
        type: 'bubble',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        // enabled: false,
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, ui-sans-serif',
          fontWeight: '400',
          colors: ['#fff', '#1f2937', '#fff'],
        },
        formatter: (value, b) => {
          if (value) {
            // console.log('222formatter', value, b);
            let a = 'A';
            if (b.seriesIndex === 1) {
              a = 'USDT';
            }
            let percent = (value / 100) * 100;
            return value ? `${a}:$${value} (${percent}%)` : '';
          } else {
            return '';
          }
        },
      },
      fill: {
        opacity: 1,
      },
      legend: {
        show: false,
      },
      stroke: {
        width: 5,
      },
      plotOptions: {
        bubble: {
          zScaling: false,
          minBubbleRadius: 40,
        },
      },
      grid: {
        show: false,
        padding: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
      xaxis: {
        min: 0,
        max: 15,
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        min: 0,
        max: 15,
        labels: {
          show: false,
        },
      },
      tooltip: {
        enabled: false,
      },
      states: {
        hover: {
          filter: {
            type: 'none',
          },
        },
      },
      // colors: ['#22d3ee', '#e5e7eb', '#3b82f6'],
      // markers: {
      //   strokeColors: 'rgb(255, 255, 255)',
      // },
      // colors: ['#3b82f6', '#22d3ee', '#e5e7eb'],
      // markers: {
      //   strokeColors: 'rgb(38, 38, 38)',
      // },
    };
  }, []);
  const seriesToken = useMemo(() => {
    // function generateData(baseval, count, yrange) {
    //   var i = 0;
    //   var series: any[] = [];
    //   while (i < count) {
    //     var x: any = Math.floor(Math.random() * (750 - 1 + 1)) + 1;
    //     var y: any =
    //       Math.floor(Math.random() * (yrange.max - yrange.min + 1)) +
    //       yrange.min;
    //     var z: any = Math.floor(Math.random() * (75 - 15 + 1)) + 15;

    //     series.push([x, y, z]);
    //     baseval += 86400000;
    //     i++;
    //   }
    //   return series;
    // }
    return [
      { data: [[3, 6, 70]] },
      { data: [[5, 4, 45]] },
      { data: [[8, 9, 90]] },
      { data: [[11, 5, 30]] },
      { data: [[13, 7, 60]] },
    ];
  }, []);
  const showTokenList = useMemo(() => {
    const allTokenList = sortedHoldingTokensList.map((i) => {
      const { symbol, value, logo } = i;
      return {
        symbol,
        value,
      };
    });
    if (allTokenList.length > MAXSHOWTOKENLEN) {
      const prevL = allTokenList.slice(0, MAXSHOWTOKENLEN - 1);
      const otherL = allTokenList.slice(MAXSHOWTOKENLEN - 1);
      const reduceF: (prev: BigNumber, curr: any) => BigNumber = (
        prev,
        curr
      ) => {
        const { value: totalBalance } = curr;
        return add(prev.toNumber(), Number(totalBalance));
      };
      let otherTotalBal = otherL.reduce(reduceF, new BigNumber(0));
      otherTotalBal = `${otherTotalBal.toFixed(2)}`;

      return [...prevL, { symbol: 'Other', value: otherTotalBal }];
    } else {
      return allTokenList;
    }
  }, [sortedHoldingTokensList]);
  const showChainList = useMemo(() => {
    const allList = sortedChainAssetsList;
    if (allList.length > MAXSHOWDATASOURCELEN) {
      const prevL = allList.slice(0, MAXSHOWDATASOURCELEN - 1);
      const otherL = allList.slice(MAXSHOWDATASOURCELEN - 1);
      const reduceF: (prev: BigNumber, curr: any) => BigNumber = (
        prev,
        curr
      ) => {
        const { totalBalance } = curr;
        return add(prev.toNumber(), Number(totalBalance));
      };
      let otherTotalBal = otherL.reduce(reduceF, new BigNumber(0));
      otherTotalBal = `${otherTotalBal.toFixed(2)}`;
      return [
        ...prevL,
        { id: 'Other', name: 'Other', totalBalance: otherTotalBal },
      ];
    } else {
      return allList;
    }
  }, [sortedChainAssetsList]);
  const optionsChain = useMemo(() => {
    const l = showChainList.map((i) => i.name);
    const fullOptions = { ...barChartBaseOptions };
    fullOptions.xaxis = { categories: l };
    return fullOptions;
  }, [showChainList, barChartBaseOptions]);
  const seriesChain = useMemo(() => {
    const l = showChainList.map((i) => i.totalBalance - 0);
    return [
      {
        data: l,
      },
    ];
  }, [showChainList]);
  return (
    <div className="homeAssetsDistribution">
      <div className="title">
        <span>Assets Distribution</span>
      </div>
      <div className="content">
        <AssetsBalance />
        <PPTabs
          list={tList}
          onChange={(p) => {
            setActiveTab(p);
          }}
          value={activeTab}
        />
        {activeTab === 'Portfolio' && (
          <Chart
            options={optionsPortfolio}
            series={seriesPortfolio}
            type="bar"
            width={504}
            height={221}
          />
        )}
        {/* {activeTab === 'Token' && (
          <Chart
            options={optionsToken}
            series={seriesToken}
            type="bubble"
            width={504}
            height={236}
          />
        )} */}
        {activeTab === 'Token' && (
          <div className="tokenChart">
            <ul className="tokenItems">
              {showTokenList.map((i) => {
                return (
                  <li className="tokenItem">
                    <div className="symbol">
                      {i.symbol !== 'Other' && (
                        <img src={tokenIconFn(i)} alt="" />
                      )}
                      <span>{i.symbol}</span>
                    </div>
                    <div className="balance">${formatNumeral(i.value)}</div>
                    <div className="percent">{balancePercentFn(i)}%</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {activeTab === 'Chain' && (
          <Chart
            options={optionsChain}
            series={seriesChain}
            type="bar"
            width={504}
            height={221}
          />
        )}
        <PButton
          type="text"
          text="View More"
          onClick={handleMore}
          className="moreBtn"
        />
      </div>
    </div>
  );
});

export default Overview;
