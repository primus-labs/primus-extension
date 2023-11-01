import React, { useCallback, memo } from 'react';

import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import CresOverview from '@/components/Cred/CredOverview';

import './index.scss';

const Cred = memo(() => {
  return (
    <div className="pageDataSourceOverview pageCred">
      <main className="appContent">
        <DataSourceSearch />
      </main>
      <CresOverview />
    </div>
  );
});

export default Cred;
