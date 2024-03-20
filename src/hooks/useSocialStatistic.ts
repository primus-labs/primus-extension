import React, { useRef, useEffect, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { add, formatNumeral } from '@/utils/utils';

import useAllSources from './useAllSources';

const useSocialStatistic = function () {
  const { sourceMap } = useAllSources();

  const connectedSocialSources = useMemo(() => {
    return sourceMap.socialSources;
  }, [sourceMap]);

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
  return {
    totalFollowers,
    formatTotalFollowers,
  };
};
export default useSocialStatistic;
