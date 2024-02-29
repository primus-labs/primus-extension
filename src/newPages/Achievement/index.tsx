import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';

import AchievementTopCard from '@/newComponents/Ahievements/TopCard';
import AchievementTaskItem from '@/newComponents/Ahievements/AchievementTaskItem';
import PageSelect from '@/newComponents/Ahievements/PageSelect';

import { getAchievementTaskList, taskStatusCheck } from '@/services/api/achievements';
import './index.scss';
import AchievementRewardHistory from '@/newComponents/Ahievements/AchievementRewardHistory';
import { Pagination } from 'antd';
import { all } from 'axios';

const AchievementHome = memo(() => {

  const [visibleAssetDialog, setVisibleAssetDialog] = useState<boolean>(false);
  const [size, setSize] = useState(7);
  const [pageCount, setPageCount] = useState(1);
  const [totolCount, setTotalCount] = useState(1);
  const [current, setCurrent] = useState(1);
  let [achievementTaskList, setAchievementTaskList] = useState<any>([]);

  const [taskIsFinished, setTaskIsFinished] = useState();

  const getAchievementTaskListFn = useCallback(async (page) => {
    const res = await getAchievementTaskList(size, page);
    const { rc, result } = res;
    if (rc === 0) {
      setAchievementTaskList(result.items);
      setTotalCount(result.totalCount);
      setPageCount(result.pageCount);
    }
  }, []);
  useEffect(() => {
    getAchievementTaskListFn(current);
  }, []);

  useEffect( () => {
    const checkAchievementTaskStatus = async () => {
      const allTasks = achievementTaskList.map((item) => {
        return item.taskIdentifier;
      });
      if (Array.isArray(allTasks) && allTasks.length > 0) {
        const tasks = allTasks.join(",")
        const res = await taskStatusCheck(tasks)
        if(res.rc === 0){
          setTaskIsFinished(res.result)
        }
      }
    }
    checkAchievementTaskStatus()
  }, [achievementTaskList]);


  const AchievementTaskItemList = () => {
    return achievementTaskList.map((item, index) => {
      const isFinished = taskIsFinished?.[item.taskIdentifier] || false;
      const taskItemWithClick = {
        taskItem: item,
        isFinished:isFinished
      };
      return <AchievementTaskItem key={index} {...taskItemWithClick} />;
    });
  };

  useEffect(() => {
    getAchievementTaskListFn(current);
  }, [current]);

  const pageChangedFn = (page) => {
    if (page === 'pre') {
      page = current - 1;
    }
    if (page === 'next') {
      page = current + 1;
    }
    if (page < 1) {
      page = 1;
    }
    if (page > pageCount) {
      page = pageCount;
    }
    setCurrent(page);
  };

  const handleCreate = useCallback(() => {
    setVisibleAssetDialog(true);
  }, []);
  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog(false);
  }, []);

  //for top card
  const handleRewordHistory = () => {
    handleCreate();
  };

  const handleSharePoints = () => {
    alert('points');
  };

  const handleShareReferralCode = () => {
    alert('code');
  };

  const getDataSourceData = async (dataSource) => {
    const data =  await chrome.storage.local.get(dataSource);
    console.log(data)
  }

  return (
    <div className="pageAchievementTaskItem">
      <AchievementTopCard handleRewardsHistory={handleRewordHistory} handleSharePoints={handleSharePoints}
                          handleShareReferralCode={handleShareReferralCode}></AchievementTopCard>
      <div className={'achievementTasks'}>
        <div className={'achievementTasksTitle'}>Task list</div>
        <AchievementTaskItemList />
        <div className={"pageComponent"}>
          <Pagination
            total={totolCount}
            onChange={pageChangedFn}
            showSizeChanger={false}
            pageSize={size}
          />
        </div>
      </div>
      {visibleAssetDialog && <AchievementRewardHistory
        onClose={handleCloseAssetDialog}
      />}
      <button onClick={getDataSourceData}>Get DataSource Data</button>

    </div>

  );
});

export default AchievementHome;
