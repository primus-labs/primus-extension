import React, { useRef, useEffect, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { add, formatNumeral } from '@/utils/utils';

import useAllSources from './useAllSources';

const useSocialStatistic = function () {
  const { sourceMap } = useAllSources();

  const connectedSocialSources = useMemo(() => {
    return sourceMap.socialSources;
  }, [sourceMap]);
  const socialDataSourcesLen = useMemo(() => {
    return Object.keys(connectedSocialSources).length;
  }, [connectedSocialSources]);
  const socialDataSourcesIconList = useMemo(() => {
    return Object.values(connectedSocialSources).map((i: any) => i.icon);
  }, [connectedSocialSources]);

  const totalFollowers = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { followers } = curr;
      return add(prev.toNumber(), Number(followers ?? 0));
    };
    const bal = Object.values(connectedSocialSources).reduce(
      reduceF,
      new BigNumber(0)
    );
    return `${bal.toFixed(0)}`;
  }, [connectedSocialSources]);

  const formatTotalFollowers = useMemo(() => {
    return totalFollowers
      ? `${formatNumeral(totalFollowers, {
          transferUnit: true,
          decimalPlaces: 0,
        })}`
      : '--';
  }, [totalFollowers]);
  const totalFollowing = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { followings } = curr;
      return add(prev.toNumber(), Number(followings ?? 0));
    };
    const bal = Object.values(connectedSocialSources).reduce(
      reduceF,
      new BigNumber(0)
    );
    return `${bal.toFixed(0)}`;
  }, [connectedSocialSources]);
  const formatTotalFollowing = useMemo(() => {
    return totalFollowing
      ? `${formatNumeral(totalFollowing, {
          transferUnit: true,
          decimalPlaces: 0,
        })}`
      : '--';
  }, [totalFollowing]);
  const totalPosts = useMemo(() => {
    const reduceF: (prev: BigNumber, curr: any) => BigNumber = (prev, curr) => {
      const { posts } = curr;
      return add(prev.toNumber(), Number(posts ?? 0));
    };
    const bal = Object.values(connectedSocialSources).reduce(
      reduceF,
      new BigNumber(0)
    );
    return `${bal.toFixed(0)}`;
  }, [connectedSocialSources]);
  const formatTotalPosts = useMemo(() => {
    return totalPosts
      ? `${formatNumeral(totalPosts, {
          transferUnit: true,
          decimalPlaces: 0,
        })}`
      : '--';
  }, [totalPosts]);
  return {
    totalFollowers,
    formatTotalFollowers,
    totalFollowing,
    formatTotalFollowing,
    totalPosts,
    formatTotalPosts,
    socialDataSourcesLen,
    socialDataSourcesIconList,
  };
};
export default useSocialStatistic;
