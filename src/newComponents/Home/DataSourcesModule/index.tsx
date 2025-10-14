import React, { memo,useMemo } from 'react';
import useAllSources from '@/hooks/useAllSources';
import useSocialStatistic from '@/hooks/useSocialStatistic';
import useAttestationsStatistics from '@/hooks/useAttestationsStatistics';
import useRewardsStatistics from '@/hooks/useRewardsStatistics';
// import AssetsDistribution from './AssetsDistribution';
import Social from './Social';
import './index.scss';
const DataSourcesModule = memo(() => {
  const { socialDataSourcesLen } = useSocialStatistic();
  const { sortedConnectedAssetsSourcesList } = useAllSources();
  const { attestationsSubmitOnChainLen } = useAttestationsStatistics();
  const { rewardsList } = useRewardsStatistics();
  const noRightContent = useMemo(() => {
    return rewardsList.length === 0 && attestationsSubmitOnChainLen === 0;
  }, [rewardsList, attestationsSubmitOnChainLen]);
  return (
    <div className={`dataSourcesModule ${noRightContent ? 'fdRow' : ''}`}>
      {/* {sortedConnectedAssetsSourcesList.length > 0 && <AssetsDistribution />} */}
      {socialDataSourcesLen > 0 && <Social />}
    </div>
  );
});
export default DataSourcesModule;
