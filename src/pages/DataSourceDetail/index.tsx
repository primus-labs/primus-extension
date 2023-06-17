import React, { useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';

import PTabs from '@/components/PTabs';
import AssetsDetail from '@/components/DataSourceDetail/AssetsDetail';

import './index.sass';

const DataSourceDetail = memo(() => {
  const navigate = useNavigate();
  const handleChangeTab = useCallback(
    (val: string) => {
      navigate('/datas');
    },
    [navigate]
  );

  return (
    <div className="pageDataSourceDetail">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <AssetsDetail />
      </main>
    </div>
  );
});

export default DataSourceDetail;
