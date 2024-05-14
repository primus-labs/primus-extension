import React, {
  
  useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import {
  SCROLLEVENTNAME,
  LUCKYDRAWEVENTNAME,
  EARLYBIRDNFTEVENTNAME,
} from '@/config/events';
import type { UserState } from '@/types/store';

const useRewardsStatistics = function (eventFilter = '') {
  const newRewards = useSelector((state: UserState) => state.newRewards);
  
  const filterdList = useMemo(() => {
    let list: any = Object.values(newRewards).reduce((prev: any, curr: any) => {
      prev.push(...Object.values(curr));
      return prev;
    }, []);
    let earlyBirdE: any = [];
    let scrollE: any = [];
    let luckyDrawE: any = [];
    let brevisE: any = [];
    if (newRewards[EARLYBIRDNFTEVENTNAME]) {
      earlyBirdE = [...Object.values(newRewards[EARLYBIRDNFTEVENTNAME])];
    }
    if (newRewards[SCROLLEVENTNAME]) {
      scrollE = [...Object.values(newRewards[SCROLLEVENTNAME])];
    }
    if (newRewards[LUCKYDRAWEVENTNAME]) {
      luckyDrawE = [...Object.values(newRewards[LUCKYDRAWEVENTNAME])];
    }
    if (newRewards['brevis']) {
      brevisE = [...Object.values(newRewards['brevis'])];
    }

    if (eventFilter === EARLYBIRDNFTEVENTNAME) {
      return earlyBirdE;
    } else if (eventFilter === SCROLLEVENTNAME) {
      return scrollE;
    } else if (eventFilter === LUCKYDRAWEVENTNAME) {
      return luckyDrawE;
    } else if (eventFilter === 'brevis') {
      return brevisE;
    } else {
      return list;
    }
  }, [
    eventFilter,
    newRewards,
  ]);
  return {
    rewardsList: filterdList,
  };
};
export default useRewardsStatistics;
