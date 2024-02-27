import React, {useState, useMemo, useCallback, useEffect, memo} from 'react';

import AchievementTopCard from "@/newComponents/Ahievements/TopCard";
import AchievementTaskItem from "@/newComponents/Ahievements/AchievementTaskItem";
import {getAchievementTaskList} from "@/services/api/achievements"
import './index.scss';

const AchievementHome = memo(() => {
    let [size, setSize] = useState(7);
    let [page, setPage] = useState(1);
    let [pageCount, setPageCount] = useState(0);
    let [totolCount, setTotalCount] = useState(0);
    let [achievementTaskList, setAchievementTaskList] = useState<any>([]);

    const getAchievementTaskListFn = useCallback(async () => {
        const res = await getAchievementTaskList(size, page)
        const {rc, result} = res;
        debugger
        if (rc === 0) {
            setAchievementTaskList(result.items);
            setTotalCount(result.totalCount)
            setPageCount(result.pageCount)
        }
    }, []);
    useEffect(() => {
        getAchievementTaskListFn()
    }, []);
    // useEffect(() => {
    //   // eslint-disable-next-line no-debugger
    //   debugger
    //   setAchievementTaskList(achievementTaskListFn);
    // }, [achievementTaskListFn]);
    const AchievementTaskItemList = () => {
        return achievementTaskList.map((item, index) => {
            return <AchievementTaskItem key={index} {...item}/>;
        });
    };
    return (
        <div className="pageAchievementTaskItem">
            <AchievementTopCard></AchievementTopCard>
            <div className={"achievementTasks"}>
                <div className={"achievementTasksTitle"}>Task list</div>
                <AchievementTaskItemList/>
            </div>


        </div>
    );
});

export default AchievementHome;
