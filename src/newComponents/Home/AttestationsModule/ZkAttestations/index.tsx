import React, { memo, useCallback, useState, useMemo } from 'react';
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
  const {
    attestationsSubmitOnChainLen,
    onChainAttestationsChainsIconList,
    onChainAttestationsTypeChainMap,
  } = useAttestationsStatistics();
  console.log('222attestationsOnChainList', onChainAttestationsTypeChainMap); // delete
  const navigate = useNavigate();

  const xArr = useMemo(() => {
    if (
      onChainAttestationsTypeChainMap &&
      Object.keys(onChainAttestationsTypeChainMap).length > 0
    ) {
      const l = Object.keys(onChainAttestationsTypeChainMap).reduce(
        (prev: any, curr: any) => {
          const currChainArr = Object.keys(
            onChainAttestationsTypeChainMap[curr]
          );
          currChainArr.forEach((c) => {
            if (prev.includes(c)) {
            } else {
              prev.push(c);
            }
          });
          return prev;
        },
        []
      );
      return l;
    } else {
      return [];
    }
  }, [onChainAttestationsTypeChainMap]);
  const yArr = useMemo(() => {
    if (
      onChainAttestationsTypeChainMap &&
      Object.keys(onChainAttestationsTypeChainMap).length > 0
    ) {
      const l = Object.keys(onChainAttestationsTypeChainMap).reduce(
        (prev: any, curr: any) => {
          const currTypeAstMap = onChainAttestationsTypeChainMap[curr];
          const currTypeOnChainsLenArr = xArr.reduce(
            (prevA: any, chain: any) => {
              const currTypeAstOnCurrChainLen = Object.values(
                currTypeAstMap[chain]
              ).length;
              prevA.push(currTypeAstOnCurrChainLen);
              return prevA;
            },
            []
          );
          prev.push({
            name: curr,
            data: currTypeOnChainsLenArr,
          });
          return prev;
        },
        []
      );
      return l;
    } else {
      return [];
    }
  }, [onChainAttestationsTypeChainMap]);
  const options = useMemo(() => {
    return {
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        
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
        // type: 'datetime',
        categories: xArr,
        // categories: [
        //   '01/01/2011 GMT',
        //   '01/02/2011 GMT',
        // ],
      },
      legend: {
        position: 'right',
        offsetY: 40,
      },
      fill: {
        opacity: 1,
      },
    }
  }, [xArr]);
  const series = useMemo(() => {
    return yArr;
    // return [
    //   {
    //     name: 'PRODUCT A',
    //     data: [44, 55],
    //   },
    //   {
    //     name: 'PRODUCT B',
    //     data: [13, 23],
    //   },
    // ];
  }, [yArr]);
  // console.log('222xArr', xArr,'yArr',yArr)// delete
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
            num={attestationsSubmitOnChainLen}
            iconList={onChainAttestationsChainsIconList}
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
