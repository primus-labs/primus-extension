import React, { memo, useState, useCallback } from 'react';
import ClaimWrapper from '../ClaimWrapper';
import RewardList from '../RewardList';
import AdSpace from '../AdSpace';
import './index.sass';

const EventsOverview = memo(() => {
  const [claimVisible, setClaimVisible] = useState<boolean>(false);
  
  const onCloseClaimDialog = useCallback(() => {
    setClaimVisible(false);
  }, []);
  const handleClickClaim = useCallback(() => {
    setClaimVisible(true)
  },[])
  return (
    <div className="eventOverview">
      <div className="eventOverviewContent">
        <AdSpace onClick={handleClickClaim} />
        <section className="rewardsWrapper">
          <header>Rewards</header>
          <RewardList />
        </section>
      </div>
      <ClaimWrapper
        visible={claimVisible}
        onClose={onCloseClaimDialog}
        onSubmit={onCloseClaimDialog}
      />
    </div>
  );
});
export default EventsOverview;
