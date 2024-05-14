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
import iconOpenSea from '@/assets/img/events/iconOpenSea.svg';
import { OPENSEALINK } from '@/config/envConstants';
import type { UserState } from '@/types/store';

const useRewardsStatistics = function (eventFilter = '') {
  const rewards = useSelector((state: UserState) => state.rewards);
  const eventsLotteryResults = useSelector(
    (state: UserState) => state.eventsLotteryResults
  );
  console.log('222rewards', rewards); // delete
  const earlyBirdNFTs = useSelector((state: UserState) => state.earlyBirdNFTs);
  const rewardList = useMemo(() => {
    return Object.values(rewards);
  }, [rewards]);
  // const joinedNFTsFlag: any = useMemo(() => {
  //   return rewardList.find((r: any) => !r.type);
  // }, [rewardList]);
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
    let earlyBirdE: any = [];
    let scrollE: any = [];
    let luckyDrawE: any = [];
    let brevisE: any = [];
    // early bird nft
    // description;
    if (Object.keys(earlyBirdNFTs).length > 0) {
      Object.keys(earlyBirdNFTs).forEach((i: any) => {
        const { name, image, description, tokenId, address } = earlyBirdNFTs[i];
        const obj = {
          id: EARLYBIRDNFTEVENTNAME + '-' + address,
          img: image,
          title: name,
          desc: description,
          linkIcon: iconOpenSea,
          link: `${OPENSEALINK}/${tokenId}`,
        };
        list.push(obj);
        earlyBirdE.push(obj);
      });
    }
    // lucky draw & scroll
    const fn = (eName) => {
      if (eventsLotteryResults[eName]) {
        const { result, iconUrl } = eventsLotteryResults[eName];
        if (result) {
          let title = '',
            desc = '';
          if (eName === LUCKYDRAWEVENTNAME) {
            title = '1st Commemorative Badge';
            desc = 'PADO event badge';
          } else if (eName === SCROLLEVENTNAME) {
            title = 'Scroll zkAttestation Medal';
            desc = 'PADO event badge';
          }
          list.push({
            id: eName,
            img: iconUrl,
            title,
            desc,
          });
        }
      }
    };
    const luckyDrawItem: any = fn(LUCKYDRAWEVENTNAME);
    if (luckyDrawItem) {
      list.push();
      luckyDrawE.push(fn(LUCKYDRAWEVENTNAME));
    }
    const scrollItem: any = fn(SCROLLEVENTNAME);
    if (scrollItem) {
      list.push(fn(SCROLLEVENTNAME));
      scrollE.push(fn(SCROLLEVENTNAME));
    }

    // brevis
    if (joinedBrevisFlag) {
      joinedBrevisRewardList.forEach((i: any) => {
        const { image, title, name } = i;
        const obj = {
          id: 'brevis' + Date.now(),
          img: image,
          title,
          desc: name,
        };
        list.push(obj);
        brevisE.push(obj);
      });
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
    eventsLotteryResults,
    joinedBrevisFlag,
    joinedBrevisRewardList,
    eventFilter,
    earlyBirdNFTs,
  ]);
  return {
    rewardsList: filterdList,
  };
};
export default useRewardsStatistics;
