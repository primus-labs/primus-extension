import React, { memo, useMemo } from 'react';
import useRewardsStatistics from '@/hooks/useRewardsStatistics';
import useAttestationsStatistics from '@/hooks/useAttestationsStatistics';
import ZkAttestations from './ZkAttestations';
import Rewards from './Rewards';
import './index.scss';
const AttestationsModule = memo(() => {
  const { attestationsSubmitOnChainLen } = useAttestationsStatistics();
  const { rewardsList } = useRewardsStatistics();
  const noRightContent = useMemo(() => {
    return rewardsList.length === 0 && attestationsSubmitOnChainLen === 0;
  }, [rewardsList, attestationsSubmitOnChainLen]);
  return (
    <>
      {noRightContent ? (
        <></>
      ) : (
        <div className="attestationsModule">
          {attestationsSubmitOnChainLen > 0 && <ZkAttestations />}
          {rewardsList.length > 0 && <Rewards />}
        </div>
      )}
    </>
  );
});
export default AttestationsModule;
