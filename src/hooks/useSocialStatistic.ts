import React, { useRef, useEffect, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { add, formatNumeral } from '@/utils/utils';

import useAllSources from './useAllSources';

const useSocialStatistic = function () {
  const { sourceMap } = useAllSources();
  const connectedSocialSourcesMap = useMemo(() => {
    return sourceMap.socialSources;
  }, [sourceMap]);
  const connectedSocialSourcesList = useMemo(() => {
    return Object.values(connectedSocialSourcesMap);
  }, [connectedSocialSourcesMap]);
  const socialDataSourcesLen = useMemo(() => {
    return connectedSocialSourcesList.length;
  }, [connectedSocialSourcesList]);
  const hasConnectedSocialDataSources = useMemo(() => {
    return socialDataSourcesLen > 0;
  }, [socialDataSourcesLen]);
  const socialDataSourcesIconList = useMemo(() => {
    return connectedSocialSourcesList.map((i: any) => i.icon);
  }, [connectedSocialSourcesList]);

  const totalFollowers = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { followers } = curr;
      return add(prev.toNumber(), Number(followers ?? 0));
    };
    const bal = connectedSocialSourcesList.reduce(reduceF, new BigNumber(0));
    return `${bal.toFixed(0)}`;
  }, [connectedSocialSourcesList]);

  const formatTotalFollowers = useMemo(() => {
    // const s = '12000'
    return totalFollowers
      ? `${formatNumeral(totalFollowers, {
          transferUnit: true,
          decimalPlaces: 2,
          transferUnitThreshold: 1000,
        })}`
      : '--';
  }, [totalFollowers]);
  const totalFollowing = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { followings } = curr;
      return add(prev.toNumber(), Number(followings ?? 0));
    };
    const bal = connectedSocialSourcesList.reduce(reduceF, new BigNumber(0));
    return `${bal.toFixed(0)}`;
  }, [connectedSocialSourcesList]);
  const formatTotalFollowing = useMemo(() => {
    return totalFollowing
      ? `${formatNumeral(totalFollowing, {
          transferUnit: false,
          decimalPlaces: 0,
        })}`
      : '--';
  }, [totalFollowing]);
  const totalPosts = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { posts } = curr;
      return add(prev.toNumber(), Number(posts ?? 0));
    };
    const bal = connectedSocialSourcesList.reduce(reduceF, new BigNumber(0));
    return `${bal.toFixed(0)}`;
  }, [connectedSocialSourcesList]);
  const formatTotalPosts = useMemo(() => {
    return totalPosts
      ? `${formatNumeral(totalPosts, {
          transferUnit: false,
          decimalPlaces: 0,
        })}`
      : '--';
  }, [totalPosts]);
  return {
    connectedSocialSourcesMap,
    connectedSocialSourcesList,
    totalFollowers,
    formatTotalFollowers,
    totalFollowing,
    formatTotalFollowing,
    totalPosts,
    formatTotalPosts,
    socialDataSourcesLen,
    socialDataSourcesIconList,
    hasConnectedSocialDataSources,
  };
};
export default useSocialStatistic;
