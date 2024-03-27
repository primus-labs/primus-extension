import React, { memo, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAttestationsStatistics from '@/hooks/useAttestationsStatistics';
import { EASInfo } from '@/config/chain';
import './index.scss';
import ModuleStatistics from '../../ModuleStatistics';
import PButton from '@/newComponents/PButton';
import BarChart from '../BarChart';
const Overview = memo(() => {
  const {
    attestationsSubmitOnChainLen,
    onChainAttestationsChainsIconList,
    onChainAttestationsTypeChainMap,
  } = useAttestationsStatistics();
  // console.log('222attestationsOnChainList', onChainAttestationsTypeChainMap); // delete
  const navigate = useNavigate();

  const xArr = useMemo(() => {
    if (
      onChainAttestationsTypeChainMap &&
      Object.keys(onChainAttestationsTypeChainMap).length > 0
    ) {
      let l = Object.keys(onChainAttestationsTypeChainMap).reduce(
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
      l = l.map((i) => ({
        // name: i === 'Linea Goerli' ? 'Linea' : i,
        name: i.replace(/\s+/g, ''),
        icon: EASInfo[i].icon,
        // icon: iconOthers,
      }));
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
              // const CName = chain.name === 'Linea' ? 'Linea Goerli' : chain.name;
              const CName = Object.keys(EASInfo).find(
                (i) => i.replace(/\s+/g, '') === chain.name
              );
              const currTypeAstOnCurrChainLen = Object.values(
                currTypeAstMap[CName as string]
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
        <BarChart xDatas={xArr} yDatas={yArr} />
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
