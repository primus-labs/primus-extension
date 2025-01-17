import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import Empty from '@/newComponents/Empty';
import DataOverview from '@/newComponents/DataDashboard/DataOverview';
import AssetsDetails from '@/newComponents/DataDashboard/AssetsDetails';
import SocialDetails from '@/newComponents/DataDashboard/SocialDetails';
import ExpiredTips from '@/newComponents/DataDashboard/ExpiredTips';
import OriginTip from '@/newComponents/DataDashboard/OriginTip';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import useSocialStatistic from '@/hooks/useSocialStatistic';

const DataDashboard: React.FC = memo(({}) => {
  const navigate = useNavigate();
  const { hasConnectedSocialDataSources } = useSocialStatistic();
  const { hasConnectedAssetsDataSources } = useAssetsStatistic();
  const hasContent = useMemo(() => {
    return hasConnectedAssetsDataSources || hasConnectedSocialDataSources;
  }, [hasConnectedAssetsDataSources]);
  const handleConnect = useCallback(() => {
    navigate('/datas');
  }, [navigate]);

  return (
    <div className="pageDataDashboard">
      <div className="pageContent">
        {hasContent ? (
          <>
            <ExpiredTips />
            <DataOverview />
            <OriginTip />
            {hasConnectedAssetsDataSources && <AssetsDetails />}
            {hasConnectedSocialDataSources && <SocialDetails />}
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
