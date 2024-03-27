import React, { memo } from 'react';
import useRewardsStatistics from '@/hooks/useRewardsStatistics';
import useAttestationsStatistics from '@/hooks/useAttestationsStatistics';
import ZkAttestations from './ZkAttestations';
import Rewards from './Rewards';
import './index.scss';
const DataSourcesModule = memo(() => {
  const { attestationsSubmitOnChainLen } = useAttestationsStatistics();
  const { rewardsList } = useRewardsStatistics();
  return (
    <div className="attestationsModule">
      {attestationsSubmitOnChainLen > 0 && <ZkAttestations />}
      {rewardsList.length > 0 && <Rewards />}
    </div>
  );
});
export default DataSourcesModule;
