import React, { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import { setActiveConnectDataSource } from '@/store/actions';
import useAttestationsStatistics from '@/hooks/useAttestationsStatistics';
import './index.scss';
import ModuleStatistics from '../../ModuleStatistics';
import PButton from '@/newComponents/PButton';
const Overview = memo(() => {
  const { attestationsOnChainLen, attestationsOnChainIconList } =
    useAttestationsStatistics();
  const navigate = useNavigate();
  const [options, setOptions] = useState({
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 10,
        dataLabels: {
          total: {
            enabled: true,
            style: {
              fontSize: '13px',
              fontWeight: 900,
            },
          },
        },
      },
    },
    xaxis: {
      type: 'datetime',
      categories: [
        '01/01/2011 GMT',
        '01/02/2011 GMT',
        '01/03/2011 GMT',
        '01/04/2011 GMT',
        '01/05/2011 GMT',
        '01/06/2011 GMT',
      ],
    },
    legend: {
      position: 'right',
      offsetY: 40,
    },
    fill: {
      opacity: 1,
    },
  });
  const [series, setSeries] = useState([
    {
      name: 'PRODUCT A',
      data: [44, 55, 41, 67, 22, 43],
    },
    {
      name: 'PRODUCT B',
      data: [13, 23, 20, 8, 13, 27],
    },
    {
      name: 'PRODUCT C',
      data: [11, 17, 15, 15, 21, 14],
    },
    {
      name: 'PRODUCT D',
      data: [21, 7, 25, 13, 22, 8],
    },
  ]);

  const handleMore = useCallback(() => {
    navigate('/zkAttestation');
  }, [navigate]);

  return (
    <div className="homeZkattestations">
      <div className="title">
        <span>zkAttestations</span>
      </div>
      <div className="content">
        <div className="top">
          <ModuleStatistics
            title="On-chain Attestations"
            num={attestationsOnChainLen}
            iconList={attestationsOnChainIconList}
          />
        </div>
        <Chart
          options={options}
          series={series}
          type="bar"
          width={504}
          height={292}
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
