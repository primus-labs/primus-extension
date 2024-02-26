import React, {memo} from "react";

import './index.scss';
import PButton from '@/newComponents/PButton';
import taskItemIcon from '@/assets/newImg/achievements/taskItemIcon.svg'

export type TaskItem = {
    taskIdentifier: string;
    taskDesc: string;
    taskXpScore: number;
    taskFrequency: string;
    taskDependencyOn?: string;
};


const AchievementTopCard = memo(() => {

    const finishTask = () => {

    }

    return (
        <div className="achievementTaskitem">
            <div className={"achievementTaskitemText"}>
                <img className={"achievementTaskitemIcon"} src={taskItemIcon}></img>
                <div className={"achievementTaskitemDesc"}>Daily check-in</div>
                <div className={"achievementTaskitemScore"}>+5xp/day</div>
            </div>
            <PButton
                text="Finish"
                onClick={finishTask}
                className={"achievementTaskitemFinishBtn"}
            /></div>

    );
});

export default AchievementTopCard;