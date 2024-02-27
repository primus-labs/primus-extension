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


const AchievementTaskItem: React.FC<TaskItem>  = memo((taskItem: TaskItem) => {

    const finishTask = () => {

    }

    return (
        <div className="achievementTaskitem">
            <div className={"achievementTaskitemText"}>
                <img className={"achievementTaskitemIcon"} src={taskItemIcon}></img>
                <div className={"achievementTaskitemDesc"}>{taskItem.taskDesc}</div>
                <div className={"achievementTaskitemScore"}>+{taskItem.taskXpScore}xp</div>
            </div>
            <PButton
                text="Finish"
                onClick={finishTask}
                className={"achievementTaskitemFinishBtn"}
            /></div>

    );
});

export default AchievementTaskItem;