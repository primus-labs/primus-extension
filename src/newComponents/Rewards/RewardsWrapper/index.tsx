import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import useRewardsStatistics from '@/hooks/useRewardsStatistics';
import {
  SCROLLEVENTNAME,
  BASEVENTNAME,
  LINEAEVENTNAME,
  LUCKYDRAWEVENTNAME,
  eventMetaMap,
  EARLYBIRDNFTEVENTNAME,
} from '@/config/events';
import { checkLotteryResults } from '@/services/api/event';
import type { UserState } from '@/types/store';
import RewardsCards from '../RewardCards';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconNetworkLinea from '@/assets/img/credit/iconNetworkLinea.svg';
import mysteryBoxImg from '@/assets/img/events/mysteryBoxImg.svg';
import iconOpenSea from '@/assets/img/events/iconOpenSea.svg';
import empty from '@/assets/newImg/zkAttestation/empty.svg';

import './index.scss';

interface PDropdownProps {
  onClick?: (item) => void;
  // list: NavItem[];
}
const Cards: React.FC<PDropdownProps> = memo(({}) => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;
  const { rewardsList } = useRewardsStatistics(eventId);
  console.log('222rewardsList', rewardsList);
  return (
    <div className="rewardsWrapper">
      <h2 className="title">Your rewards from participated events</h2>
      {rewardsList.length > 0 ? (
        <RewardsCards list={rewardsList} />
      ) : (
        <div className="hasNoContent">
          <img src={empty} alt="" />
          <div className="introTxt">
            <div className="title">No rewards yet </div>
            <div className="desc">Go to Events page to participate.</div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Cards;
