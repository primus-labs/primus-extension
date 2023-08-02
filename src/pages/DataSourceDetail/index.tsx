import React, { useCallback, memo, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import PTabs from '@/components/PTabs';
import AssetsDetail from '@/components/DataSourceDetail/AssetsDetail';
import OnChainAssetsDetail from '@/components/DataSourceDetail/OnChainAssetsDetail';

import './index.sass';

const DataSourceDetail = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchName = searchParams.get('name') as string;
  const isOnChainData = useMemo(() => {
    return decodeURIComponent(searchName) === 'On-chain Assets';
  }, [searchName]);
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
        {isOnChainData ? <OnChainAssetsDetail /> : <AssetsDetail />}
        {/* <AssetsDetail /> */}
      </main>
    </div>
  );
});

export default DataSourceDetail;
