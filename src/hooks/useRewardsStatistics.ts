import React, {
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import {
  SCROLLEVENTNAME,
  LUCKYDRAWEVENTNAME,
  EARLYBIRDNFTEVENTNAME,
} from '@/config/events';
import { checkLotteryResults } from '@/services/api/event';
import iconOpenSea from '@/assets/img/events/iconOpenSea.svg';
import type { UserState } from '@/types/store';

const useRewardsStatistics = function () {
  const [eventsResult, setEventsResult] = useState<any>({});
  const events = useSelector((state: UserState) => state.events);
  const rewards = useSelector((state: UserState) => state.rewards);
  const rewardList = useMemo(() => {
    return Object.values(rewards);
  }, [rewards]);
  const joinedNFTsFlag: any = useMemo(() => {
    return rewardList.find((r: any) => !r.type);
  }, [rewardList]);
  const joinedBrevisRewardList = useMemo(() => {
    return rewardList.filter(
      (r: any) => r?.event === 'brevis' && r.type === 'NFT'
    );
  }, [rewardList]);
  const joinedBrevisFlag = useMemo(() => {
    return joinedBrevisRewardList.length > 0;
  }, [joinedBrevisRewardList]);
  const filterdList = useMemo(() => {
    let list: any = [
      // {
      //   id: EARLYBIRDNFTEVENTNAME,
      //   img: iconOpenSea,
      //   title: 'Early Adopters #001',
      //   desc: 'PADO Early Bird NFT',
      //   linkIcon: iconOpenSea,
      //   link: `https://opensea.io/assets/matic/0x616bdf7e9041c6f76b0ff6de9af5da2c88a9ac98/${tokenId}`,
      // },
    ];
    // early bird nft
    if (joinedNFTsFlag) {
      const { image, tokenId } = joinedNFTsFlag;
      list.push({
        id: EARLYBIRDNFTEVENTNAME,
        img: image,
        title: 'Early Adopters #001',
        desc: 'PADO Early Bird NFT',
        linkIcon: iconOpenSea,
        link: `https://opensea.io/assets/matic/0x616bdf7e9041c6f76b0ff6de9af5da2c88a9ac98/${tokenId}`,
      });
    }
    // lucky draw & scroll
    const eventNameArr = [LUCKYDRAWEVENTNAME, SCROLLEVENTNAME];
    eventNameArr.forEach((i) => {
      if (eventsResult[i]) {
        const { result, iconUrl } = eventsResult[i];
        let title = '',
          desc = '';
        if (i === LUCKYDRAWEVENTNAME) {
          title = '1st Commemorative Badge';
          desc = 'PADO event badge';
        } else if (i === SCROLLEVENTNAME) {
          title = 'Scroll zkAttestation Medal';
          desc = 'PADO event badge';
        }
        if (result) {
          list.push({
            id: i,
            img: iconUrl,
            title,
            desc,
          });
        }
      }
    });
    // brevis
    if (joinedBrevisFlag) {
      joinedBrevisRewardList.forEach((i: any) => {
        const { image, title, name } = i;
        list.push({
          id: 'brevis' + Date.now(),
          img: image,
          title,
          desc: name,
        });
      });
    }

    return list;
  }, [eventsResult, joinedNFTsFlag, joinedBrevisFlag, joinedBrevisRewardList]);
  const fetchLotteryResults = useCallback(async () => {
    try {
      const eventNameArr = [LUCKYDRAWEVENTNAME, SCROLLEVENTNAME];
      const requestArr = eventNameArr.map((r) => {
        return checkLotteryResults({
          event: r,
        });
      });
      const resArr = await Promise.all(requestArr);
      const obj = resArr.reduce((prev, curr, currK) => {
        const { rc, result } = curr;
        if (rc === 0) {
          prev[eventNameArr[currK]] = result;
        }
        return prev;
      }, {});
      setEventsResult(obj);
    } catch (e) {
      console.log('fetchLotteryResults catch e=', e);
    }
  }, []);
  useEffect(() => {
    fetchLotteryResults();
  }, []);
  return {
    rewardsList: filterdList,
  };
};
export default useRewardsStatistics;
