import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import PButton from '@/newComponents/PButton';
import Empty from '@/newComponents/Empty';
import DataOverview from '@/newComponents/DataDashboard/DataOverview';
import AssetsDetails from '@/newComponents/DataDashboard/AssetsDetails';
import SocialDetails from '@/newComponents/DataDashboard/SocialDetails';
const DataDashboard: React.FC = memo(({}) => {
  const navigate = useNavigate();
  const handleConnect = useCallback(() => {
    navigate('/datas');
  }, [navigate]);
  return (
    <div className="pageDataDashboard">
      <div className="pageContent">
        {/* <Empty
        title="No data"
        desc="Please connect to the data source"
        btnTxt="Connect data source"
        onSubmit={handleConnect}
      /> */}
        <DataOverview />
        <AssetsDetails />
        <SocialDetails />
      </div>
    </div>
  );
});

export default DataDashboard;
