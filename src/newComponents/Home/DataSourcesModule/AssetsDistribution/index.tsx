import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import { setActiveConnectDataSource } from '@/store/actions';
import './index.scss';
import AssetsBalance from '@/newComponents/AssetsBalance';
import PButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import useAllSources from '@/hooks/useAllSources';

const tList = [
  { label: 'Portfolio', value: 'Portfolio' },
  { label: 'Token', value: 'Token' },
  { label: 'Chain', value: 'Chain' },
];
const Overview = memo(() => {
  const { sortedConnectedAssetsSourcesList } = useAllSources();
  console.log('222', sortedConnectedAssetsSourcesList); //delete
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Portfolio');
  const handleMore = useCallback(() => {
    navigate('/datas');
  }, [navigate]);

  const xArr = useMemo(() => {
    const l = sortedConnectedAssetsSourcesList.map((i) => i.name);
    return l;
  }, []);
  const yArr = useMemo(() => {
    const l = sortedConnectedAssetsSourcesList.map((i) => i.totalBalance - 0);
    return l;
  }, []);
  const options = useMemo(() => {
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
        categories: xArr,
      },
    };
  }, [xArr]);
  const series = useMemo(() => {
    return [
      {
        data: yArr,
      },
    ];
  }, [yArr]);

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
        <Chart
          options={options}
          series={series}
          type="bar"
          width={504}
          height={236}
        />
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
