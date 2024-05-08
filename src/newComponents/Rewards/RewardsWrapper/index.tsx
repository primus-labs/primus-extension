import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import useRewardsStatistics from '@/hooks/useRewardsStatistics';
import { EVENTNAMEMAP } from '@/config/events';
import RewardsCards from '../RewardCards';
import PBack from '@/newComponents/PBack';
import empty from '@/assets/newImg/zkAttestation/empty.svg';

import './index.scss';

interface PDropdownProps {
  onClick?: (item) => void;
  // list: NavItem[];
}
const Cards: React.FC<PDropdownProps> = memo(({}) => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;
  const { rewardsList } = useRewardsStatistics(eventId);
  console.log('222rewardsList', rewardsList);
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  return (
    <div className="rewardsWrapper">
      <PBack onBack={handleBack} withLabel />
      <h2 className="title">
        Your rewards from {eventId ? EVENTNAMEMAP[eventId] : 'participated'}{' '}
        events
      </h2>
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
