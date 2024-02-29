import React, { memo, useState } from 'react';

import './index.scss';
import PButton from '@/newComponents/PButton';
import taskItemIcon from '@/assets/newImg/achievements/taskItemIcon.svg'
import { finishTask } from '@/services/api/achievements';

export type TaskItem = {
    taskIcon:string;
    taskIdentifier: string;
    taskDesc: string;
    taskXpScore: number;
    taskFrequency: string;
    taskDependencyOn?: string;
};

export type TaskItemWithClick = {
    taskItem: TaskItem;
    isFinished: boolean
};


const AchievementTaskItem: React.FC<TaskItemWithClick>  = memo((taskItemWithClick: TaskItemWithClick) => {
    const taskItem = taskItemWithClick.taskItem;
    const [finished,setFinished] = useState(taskItemWithClick.isFinished)

    const getDataSourceData = async () => {
        debugger
        const datasource = 'x';
        const data =  await chrome.storage.local.get(datasource);
        console.log(data)
    }


    const handleClick = async () => {
        let ext = {}
        const finishBody = {
            taskIdentifier: taskItem.taskIdentifier,
            ext: ext
        }
        if (taskItem.taskIdentifier === '') {
            ext = {}
        }
        const res = await finishTask(finishBody)
        if(res.rc===0){
            setFinished(true)
        }
    }

    return (
        <div className="achievementTaskitem">
            <div className={"achievementTaskitemText"}>
                <img className={"achievementTaskitemIcon"} src={taskItemIcon}></img>
                <input type={"hidden"} value={taskItem.taskIdentifier}/>
                <div className={"achievementTaskitemDesc"}>{taskItem.taskDesc}</div>
                <div className={"achievementTaskitemScore"}>
                    {(() => {
                        if (taskItem.taskFrequency === 'DAY') {
                            return `+${taskItem.taskXpScore}xp/day`;
                        } else if(taskItem.taskFrequency === 'ONLY_ONCE'){
                            return `+${taskItem.taskXpScore}xp`;
                        }else if(taskItem.taskFrequency === 'USER'){
                            return `+${taskItem.taskXpScore}xp/user`;
                        }else if(taskItem.taskFrequency === 'EVENT'){
                            return `+${taskItem.taskXpScore}xp/event`;
                        }else if(taskItem.taskFrequency === 'ATTESTATION'){
                            return `+${taskItem.taskXpScore}xp/attestation`;
                        }
                    })()}
                </div>
            </div>
            <PButton
                text="Finish"
                disabled={finished}
                onClick={handleClick}
                className={"achievementTaskitemFinishBtn"}
            /></div>

    );
});

export default AchievementTaskItem;