import React, { memo } from 'react';

import RewardItem from './RewardItem';
import emptyReward from '@/assets/img/events/emptyReward.svg'

import type {
  // SocialDataList,
  // ExDataList,
  SourceDataList,
  SourceData,
} from '@/types/dataSource';
import './index.sass';

export type DataSourceItemList = any[];

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
        {/* <RewardItem /> */}
        {list.length < 1 && (
          <div className="emptyWrapper">
            <img src={emptyReward} alt="" />
            <p>Completing tasks to get your rewards.</p>
          </div>
        )}
      </div>
    );
  }
);

export default RewardList;
