import React, { memo } from 'react';
import ZkAttestations from './ZkAttestations';
import Rewards from './Rewards';
import './index.scss';
const DataSourcesModule = memo(() => {
  return (
    <div className="attestationsModule">
      <ZkAttestations />
      <Rewards />
    </div>
  );
});
export default DataSourcesModule;
