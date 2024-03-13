import React, { memo } from 'react';
import { DATASOURCEMAP } from '@/config/dataSource2';
import './index.scss';

interface DataSourceBriefProps {
  id: string;
}
const DataSourceBrief: React.FC<DataSourceBriefProps> = memo(
  ({ id: dataSourceId }) => {
    // console.log('222dataSourceId', dataSourceId, DATASOURCEMAP[dataSourceId]);
    const dataSourceMetaInfo = DATASOURCEMAP[dataSourceId];
    return (
      <div className="dataSourceBrief">
        <img src={dataSourceMetaInfo.icon} alt="" />
        <div className="intro">
          <div className="name">{dataSourceMetaInfo.name}</div>
          <div className="origin">
            {dataSourceMetaInfo.provider
              ? ` Provide by ${dataSourceMetaInfo.provider}`
              : 'By Community'}
          </div>
        </div>
      </div>
    );
  }
);

export default DataSourceBrief;
