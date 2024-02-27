import React, {memo} from "react";

import './index.scss';
import PButton from '@/newComponents/PButton';
import taskItemIcon from '@/assets/newImg/achievements/taskItemIcon.svg'

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
    onClick: any;
};



const AchievementTaskItem: React.FC<TaskItemWithClick>  = memo((taskItemWithClick: TaskItemWithClick) => {
    const taskItem = taskItemWithClick.taskItem;
    const onClickFn = taskItemWithClick.onClick;
    const handleClock = ()=>{
        onClickFn(taskItem.taskIdentifier)
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
                onClick={handleClock}
                className={"achievementTaskitemFinishBtn"}
            /></div>

    );
});

export default AchievementTaskItem;