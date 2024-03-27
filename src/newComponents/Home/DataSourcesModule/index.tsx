import React, { memo } from 'react';
import useAllSources from '@/hooks/useAllSources';
import useSocialStatistic from '@/hooks/useSocialStatistic';
import AssetsDistribution from './AssetsDistribution';
import Social from './Social';
import './index.scss';
const DataSourcesModule = memo(() => {
  const { socialDataSourcesLen } = useSocialStatistic();
  const { sortedConnectedAssetsSourcesList } = useAllSources();
  return (
    <div className="dataSourcesModule">
      {sortedConnectedAssetsSourcesList.length > 0 && <AssetsDistribution />}
      {socialDataSourcesLen > 0 && <Social />}
    </div>
  );
});
export default DataSourcesModule;
