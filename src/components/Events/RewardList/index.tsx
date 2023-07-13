import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import RewardItem from './RewardItem';
import emptyReward from '@/assets/img/events/emptyReward.svg'
import type { UserState } from '@/types/store';

import type {
  // SocialDataList,
  // ExDataList,
  SourceDataList,
  SourceData,
} from '@/types/dataSource';
import type { RewardList } from '@/types/event';

import './index.sass';

export type DataSourceItemList = any[];

interface DataSourceItemProps {
  // list?: SourceDataList;
  // onCheck?: (item: SourceData) => void;
}

const RewardListC = memo(
  () => {
    const rewards = useSelector((state: UserState) => state.rewards);
    const rewardList: RewardList = useMemo(() => {
      return Object.values(rewards);
    }, [rewards]);
    return (
      <div className="rewardList">
        {/* {list.length < 1 && <EmptyDataSourceItem onAdd={handleAdd} />} */}
        {rewardList.map((item) => {
          return <RewardItem key={item.name} item={item} />;
        })}
        {rewardList.length < 1 && (
          <div className="emptyWrapper">
            <img src={emptyReward} alt="" />
            <p>Completing tasks to get your rewards.</p>
          </div>
        )}
      </div>
    );
  }
);

export default RewardListC;
