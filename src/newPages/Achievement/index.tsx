import React, {useState, useMemo, useCallback, useEffect, memo} from 'react';

import AchievementTopCard from "@/newComponents/Ahievements/TopCard";
import AchievementTaskItem from "@/newComponents/Ahievements/AchievementTaskItem";
import PageSelect from "@/newComponents/Ahievements/PageSelect";

import {getAchievementTaskList} from "@/services/api/achievements"
import './index.scss';

const AchievementHome = memo(() => {
    const [size, setSize] = useState(7);
    const [pageCount, setPageCount] = useState(1);
    const [totolCount, setTotalCount] = useState(1);
    const [current, setCurrent] = useState(1);
    let [achievementTaskList, setAchievementTaskList] = useState<any>([]);

    const getAchievementTaskListFn = useCallback(async (page) => {
        const res = await getAchievementTaskList(size, page)
        const {rc, result} = res;
        if (rc === 0) {
            setAchievementTaskList(result.items);
            setTotalCount(result.totalCount)
            setPageCount(result.pageCount)
        }
    }, []);
    useEffect(() => {
        getAchievementTaskListFn(current)
    }, []);


    const handleFinishTask = (identifier) => {
        // eslint-disable-next-line no-undef
        console.log(identifier)
    }
    const AchievementTaskItemList = () => {
        return achievementTaskList.map((item, index) => {
            const taskItemWithClick = {
                onClick: handleFinishTask,
                taskItem: item
            }
            return <AchievementTaskItem key={index} {...taskItemWithClick}/>;
        });
    };

    useEffect(() => {
        getAchievementTaskListFn(current)
    }, [current]);

    const pageChangedFn = (page)=>{
        if(page ==='pre'){
            page = current-1
        }
        if(page === 'next'){
            page = current+1
        }
        if(page<1){
            page = 1;
        }
        if(page>pageCount){
            page = pageCount
        }
        setCurrent(page)
    }

    const PageSelectComponent = ()=>{
        return <PageSelect totalPage={pageCount} onClick={pageChangedFn} current={current}/>
    }

    return (
        <div className="pageAchievementTaskItem">
            <AchievementTopCard></AchievementTopCard>
            <div className={"achievementTasks"}>
                <div className={"achievementTasksTitle"}>Task list</div>
                <AchievementTaskItemList/>
                <PageSelectComponent/>
            </div>


        </div>
    );
});

export default AchievementHome;
