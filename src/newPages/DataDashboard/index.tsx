import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import PButton from '@/newComponents/PButton';
import Empty from '@/newComponents/Empty';
import DataOverview from '@/newComponents/DataDashboard/DataOverview';
import AssetsDetails from '@/newComponents/DataDashboard/AssetsDetails';
import SocialDetails from '@/newComponents/DataDashboard/SocialDetails';
import useAllSources from '@/hooks/useAllSources';
const DataDashboard: React.FC = memo(({}) => {
  const { sourceMap } = useAllSources();
  const navigate = useNavigate()
  const hasContent = useMemo(() => {
    return (
      Object.keys(sourceMap.exSources).length > 0 ||
      Object.keys(sourceMap.socialSources).length > 0
    );
  }, [sourceMap]);
  const handleConnect = useCallback(() => {
    navigate('/datas');
  }, [navigate]);

  return (
    <div className="pageDataDashboard">
      <div className="pageContent">
        {hasContent ? (
          <>
            <DataOverview />
            <AssetsDetails />
            <SocialDetails />
          </>
        ) : (
          <Empty
            title="No data"
            desc="Please connect to the data source"
            btnTxt="Connect data source"
            onSubmit={handleConnect}
          />
        )}
      </div>
    </div>
  );
});

export default DataDashboard;
