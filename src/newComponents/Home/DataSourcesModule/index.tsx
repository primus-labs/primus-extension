import React, { memo } from 'react';
import AssetsDistribution from './AssetsDistribution';
import Social from './Social'
import './index.scss';
const DataSourcesModule = memo(() => {
  return (
    <div className="dataSourcesModule">
      <AssetsDistribution />
      <Social/>
    </div>
  );
});
export default DataSourcesModule;
