import React, { useCallback, memo } from 'react';

import PTabs from '@/components/PTabs';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import CresOverview from '@/components/Cred/CredOverview';

import './index.sass';

const Cred = memo(() => {
  const handleChangeTab = useCallback((val: string) => {}, []);
  return (
    <div className="pageDataSourceOverview pageCred">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} value="Proofs" />
        <DataSourceSearch />
      </main>
      <CresOverview />
    </div>
  );
});

export default Cred;
