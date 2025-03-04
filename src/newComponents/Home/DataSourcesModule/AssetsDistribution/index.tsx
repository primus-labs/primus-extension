import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import { sub, add } from '@/utils/utils';
import useAllSources from '@/hooks/useAllSources';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';

import './index.scss';
import AssetsBalance from '@/newComponents/AssetsBalance';
import PButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import BarChart2 from '../BarChart2';
import TokenPie from '../TokenPie';

import iconOthers from '@/assets/newImg/home/iconOthers.svg';

const MAXSHOWTOKENLEN = 5;
const MAXSHOWDATASOURCELEN = 4;

const Overview = memo(() => {
  const {
    sortedChainAssetsList,
    hasChainAssets,
    hasTokenAssets,
    metamaskAssets,
  } = useAssetsStatistic();

  const { sourceMap } = useAllSources();
  const connectedExchangeSources = useMemo(() => {
    return sourceMap.exSources;
  }, [sourceMap]);
  const connectedOnChainSources = useMemo(() => {
    return sourceMap.onChainAssetsSources;
  }, [sourceMap]);
  const connectedAssetsSourcesList = useMemo(() => {
    let l = Object.values(connectedExchangeSources);
    if (Object.keys(connectedOnChainSources).length > 0) {
      // const newOnChainList = Object.values(connectedOnChainSources).map(
      //   (i: any) => {
      //     const { name, icon } = WALLETMAP['metamask'];
      //     return Object.assign(i, { name, icon, id: i.address });
      //   }
      // );
      const newOnChainList = [metamaskAssets];
      l = l.concat(newOnChainList);
    }
    return l;
  }, [connectedExchangeSources, connectedOnChainSources, metamaskAssets]);
  const sortedConnectedAssetsSourcesList = useMemo(() => {
    const sortFn = (l) => {
      return l.sort((a: any, b: any) =>
        sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
      );
    };
    let noStarL = connectedAssetsSourcesList.filter((i: any) => !i.star);
    let hasStarL = connectedAssetsSourcesList.filter((i: any) => !!i.star);
    noStarL = sortFn(noStarL);
    hasStarL = sortFn(hasStarL);
    console.log('222sortedConnectedAssetsSourcesList', noStarL, hasStarL); //delete
    return [...hasStarL, ...noStarL];
  }, [connectedAssetsSourcesList]);

  // console.log(
  //   '222useAssetsStatistic',
  //   sortedConnectedAssetsSourcesList,
  //   sortedHoldingTokensList,
  //   sortedChainAssetsList
  // ); //delete
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Portfolio');
  const handleMore = useCallback(() => {
    navigate('/dataDashboard');
  }, [navigate]);

  const tList = useMemo(() => {
    let arr = [{ label: 'Portfolio', value: 'Portfolio' }];
    if (hasTokenAssets) {
      arr.push({ label: 'Token', value: 'Token' });
    }
    if (hasChainAssets) {
      arr.push({ label: 'Chain', value: 'Chain' });
    }
    return arr;
  }, [hasTokenAssets, hasChainAssets]);
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
      let otherTotalBal: any = otherL.reduce(reduceF, new BigNumber(0));
      otherTotalBal = `${otherTotalBal.toFixed(2)}`;
      return [
        ...prevL,
        { id: 'Other', name: 'Other', totalBalance: otherTotalBal },
      ];
    } else {
      return allList;
    }
  }, [sortedConnectedAssetsSourcesList]);

  const reverseShowPortfolioList = useMemo(() => {
    return showPortfolioList.reverse();
  }, [sortedConnectedAssetsSourcesList]);
  const xDatasPortfolio = useMemo(() => {
    const l = reverseShowPortfolioList.map((i: any) => ({
      name: i.name,
      icon: i.icon ?? iconOthers,
    }));
    return l;
  }, [reverseShowPortfolioList, barChartBaseOptions]);
  const yDatasPortfolio = useMemo(() => {
    const l = reverseShowPortfolioList.map((i: any) => i.totalBalance - 0);
    return l;
  }, [reverseShowPortfolioList]);

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
  const reverseShowChainList = useMemo(() => {
    return showChainList.reverse();
  }, [showChainList]);
  const xDatasChain = useMemo(() => {
    const l = reverseShowChainList.map((i) => ({
      name: i.name.replace(/\s+/g, ''),
      icon: i.icon ?? iconOthers,
    }));
    return l;
  }, [reverseShowPortfolioList, barChartBaseOptions]);
  const yDatasChain = useMemo(() => {
    const l = reverseShowChainList.map((i) => i.totalBalance - 0);
    return l;
  }, [reverseShowPortfolioList]);
  const tokenMapDatas = useMemo(() => {
    const l = reverseShowChainList.map((i) => {
      i.tokenListMap = i.tokenListMap ?? {};
      const allList = Object.values(i.tokenListMap);
      const MAXSHOWTOEKNLEN = 6;
      let showList = [...allList];
      if (allList.length > MAXSHOWTOEKNLEN) {
        const prevL = allList.slice(0, MAXSHOWTOEKNLEN - 1);
        const otherL = allList.slice(MAXSHOWTOEKNLEN - 1);
        const reduceF: (prev: BigNumber, curr: any) => BigNumber = (
          prev,
          curr
        ) => {
          const { value: totalBalance } = curr;
          return add(prev.toNumber(), Number(totalBalance));
        };
        let otherTotalBal: any = otherL.reduce(reduceF, new BigNumber(0));
        otherTotalBal = `${otherTotalBal.toFixed(2)}`;
        showList = [...prevL, { symbol: 'Others', value: otherTotalBal }];
      }
      return showList;
    });
    return l;
  }, [reverseShowPortfolioList]);
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
          <BarChart2 xDatas={xDatasPortfolio} yDatas={yDatasPortfolio} />
        )}
        {/* totalOnChainAssetsBalance,totalAssetsBalance, */}
        {activeTab === 'Chain' && hasChainAssets && (
          <BarChart2
            xDatas={xDatasChain}
            yDatas={yDatasChain}
            tokenMapDatas={tokenMapDatas}
          />
        )}
        {activeTab === 'Token' && hasTokenAssets && <TokenPie />}
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
