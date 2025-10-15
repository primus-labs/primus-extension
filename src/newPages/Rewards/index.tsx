import React, { memo } from 'react';
import RewardsWrapper from '@/newComponents/Rewards/RewardsWrapper';

import './index.scss';

const Home = memo(() => {
  return (
    <div className="pageRewards">
      <div className="pageContent">
        <RewardsWrapper />
      </div>
    </div>
  );
});
export default Home;
