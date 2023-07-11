import React, { memo } from 'react';

import RewardItem from './RewardItem';

import type {
  // SocialDataList,
  // ExDataList,
  SourceDataList,
  SourceData,
} from '@/types/dataSource';
import './index.sass';

export type DataSourceItemList = DataSourceItemType[];

interface DataSourceItemProps {
  list?: SourceDataList;
  onCheck?: (item: SourceData) => void;
}

const RewardList: React.FC<DataSourceItemProps> = memo(
  ({ onCheck, list = [] }) => {
    return (
      <div className="rewardList">
        {/* {list.length < 1 && <EmptyDataSourceItem onAdd={handleAdd} />} */}
        {list.map((item) => {
          return <RewardItem key={item.name} item={item} onCheck={onCheck} />;
        })}
        <RewardItem />
      </div>
    );
  }
);

export default RewardList;
