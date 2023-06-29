import React, { useState, useMemo, memo, useCallback } from 'react';
import BigNumber from 'bignumber.js';

import SourcesStatisticsBar from '../SourcesStatisticsBar';
import SocialSourcesTable from '@/components/AssetsOverview/SocialSourcesTable';
import PieChart from '../PieChart';

import { add, formatNumeral } from '@/utils/utils';

import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem';
import type { DataSourceItemList } from '@/components/DataSourceOverview/DataSourceList';
import type { SocialDataList, SocialData } from '@/types/dataSource';
import '../AssetsOverview/index.sass';

interface AssetsOverviewProps {
  filterSource: string | undefined;
  onClearFilter: () => void;
  // list: DataSourceItemList;
  list: SocialDataList;
}

const SocialOverview: React.FC<AssetsOverviewProps> = memo(
  ({ filterSource, onClearFilter, list }) => {
    const [activeSourceName, setActiveSourceName] = useState<string>();

    const totalFollowers = useMemo(() => {
      const reduceF: (prev: BigNumber, curr: SocialData) => BigNumber = (
        prev,
        curr
      ) => {
        const { followers } = curr;
        return add(prev.toNumber(), Number(followers));
      };
      const bal = list.reduce(reduceF, new BigNumber(0));
      return `${bal.toFixed()}`;
    }, [list]);
    const totalFollowings = useMemo(() => {
      const reduceF: (prev: BigNumber, curr: SocialData) => BigNumber = (
        prev,
        curr
      ) => {
        const { followings } = curr;
        return add(prev.toNumber(), Number(followings));
      };
      const bal = list.reduce(reduceF, new BigNumber(0));
      return `${bal.toFixed()}`;
    }, [list]);
    const totalPosts = useMemo(() => {
      const reduceF: (prev: BigNumber, curr: SocialData) => BigNumber = (
        prev,
        curr
      ) => {
        const { posts } = curr;
        return add(prev.toNumber(), Number(posts));
      };
      const bal = list.reduce(reduceF, new BigNumber(0));
      return `${bal.toFixed()}`;
    }, [list]);
    const totalVerifiedAcct = useMemo(() => {
      const reduceF: (prev: number, curr: SocialData) => number = (
        prev,
        curr
      ) => {
        const { name, verified, remarks } = curr;
        let activeNum = verified ? 1 : 0;
        const lowerCaseSourceName = name.toLowerCase();
        if (lowerCaseSourceName === 'discord') {
          const flagArr = remarks?.flags.split(',') ?? [];
          activeNum = flagArr.length;
        }
        return prev + activeNum;
      };
      const bal = list.reduce(reduceF, 0);
      return bal;
    }, [list]);
    const activeSourceTokenList = useMemo(() => {
      if (activeSourceName) {
        const activeS: DataSourceItemType[] = list.filter(
          (item) => item.name === activeSourceName
        ) as DataSourceItemType[];
        return activeS;
      } else {
        return list;
      }
    }, [list, activeSourceName]);
    const getChartData = useMemo(() => {
      const chartData = list.map(({ name, followers }) => ({
        name,
        value: followers ? new BigNumber(followers as number).toFixed(0) : '0',
      }));
      return chartData;
    }, [list]);

    const handleSelectSource = useCallback((sourceName: string | undefined) => {
      setActiveSourceName(sourceName);
    }, []);

    return (
      <div className="assetsOverview">
        <section className="statisticsWrapper">
          <div className="card cardL">
            <header>Overview</header>
            <div className="cardCon">
              <div className="descItem mainDescItem">
                <div className="label">Total Followers</div>
                <div className="value">
                  {formatNumeral(totalFollowers as string, {
                    transferUnit: false,
                    decimalPlaces: 0,
                  })}
                </div>
              </div>
              <div className="descItemsWrapper">
                <div className="descItem">
                  <div className="label">Total Following</div>
                  <div className="value">
                    {formatNumeral(totalFollowings as string, {
                      transferUnit: false,
                      decimalPlaces: 0,
                    })}
                  </div>
                </div>
                <div className="descItem">
                  <div className="label">Total Posts</div>
                  <div className="value">
                    {formatNumeral(totalPosts as string, {
                      transferUnit: false,
                      decimalPlaces: 0,
                    })}
                  </div>
                </div>
                <div className="descItem">
                  <div className="label">Acct. Tags</div>
                  <div className="value">{totalVerifiedAcct}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card cardR">
            <header>Distribution</header>
            <div className="cardCon">
              <PieChart list={getChartData} />
            </div>
          </div>
        </section>
        <SourcesStatisticsBar
          list={list}
          onSelect={handleSelectSource}
          filterSource={filterSource}
          type="Social"
          onClearFilter={onClearFilter}
        />
        <SocialSourcesTable list={activeSourceTokenList} />
      </div>
    );
  }
);

export default SocialOverview;
