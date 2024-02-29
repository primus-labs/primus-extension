import React, { memo, useState } from 'react';

import './index.scss';
import PButton from '@/newComponents/PButton';
import taskItemIcon from '@/assets/newImg/achievements/taskItemIcon.svg';
import { finishTask } from '@/services/api/achievements';

export type TaskItem = {
  taskIcon: string;
  taskIdentifier: string;
  taskDesc: string;
  taskXpScore: number;
  taskFrequency: string;
  taskDependencyOn?: string;
};

export type TaskItemWithClick = {
  taskItem: TaskItem;
  isFinished: boolean;
  showCodeDiag: any;
  referralCode: string
};


const AchievementTaskItem: React.FC<TaskItemWithClick> = memo((taskItemWithClick: TaskItemWithClick) => {
  const taskItem = taskItemWithClick.taskItem;
  const showCodeDiag = taskItemWithClick.showCodeDiag;
  const [finished, setFinished] = useState(taskItemWithClick.isFinished);

  const getDataSourceData = async (datasource) => {
    const data = await chrome.storage.local.get(datasource);
    console.log(data);
    return data;
  };


  const handleClick = async () => {
    let ext = {};

    if (taskItem.taskIdentifier === 'DAILY_CHECK_IN') {
      ext = {};
    }
    if (taskItem.taskIdentifier === 'DAILY_DISCORD_GM') {
      const res = await getDataSourceData('discord');
      if (!res.discord) {
        return;
      }
      const discordUserInfo = JSON.parse(res.discord);
      debugger
      ext = {
        name: discordUserInfo.userName,
        discordUserId: discordUserInfo.uniqueId.replace('DISCORD_', ''),
      };
    }
    if (taskItem.taskIdentifier === 'CONNECT_X_DATA' || taskItem.taskIdentifier === 'FOLLOW_PADOLABS') {
      const res = await getDataSourceData('x');
      if (!res.x) {
        return;
      }
      const xUserInfo = JSON.parse(res.x);
      console.log(res);
      ext = {
        uniqueName: xUserInfo.screenName,
      };
    }
    if (taskItem.taskIdentifier === 'CONNECT_DISCORD_DATA') {
      const res = await getDataSourceData('discord');
      if (!res.discord) {
        return;
      }
      const discordUserInfo = JSON.parse(res.discord);
      console.log(res);
      ext = {
        uniqueName: discordUserInfo.userName,
      };
    }

    if( taskItem.taskIdentifier ==='JOIN_PADO_DISCORD'){
      const res = await getDataSourceData('discord');
      if (!res.discord) {
        return;
      }
      const discordUserInfo = JSON.parse(res.discord);
      ext = {
        discordUserId: discordUserInfo.uniqueId.replace('DISCORD_', '')
      };
    }
    if( taskItem.taskIdentifier ==='SIGN_IN_USING_AN_REFERRAL_CODE'){
      showCodeDiag(true)
    }



    const finishBody = {
      taskIdentifier: taskItem.taskIdentifier,
      ext: ext,
    };
    const res = await finishTask(finishBody);
    if (res.rc === 0) {
      setFinished(true);
    }
  };

  return (
    <div className="achievementTaskitem">
      <div className={'achievementTaskitemText'}>
        <img className={'achievementTaskitemIcon'} src={taskItemIcon}></img>
        <input type={'hidden'} value={taskItem.taskIdentifier} />
        <div className={'achievementTaskitemDesc'}>{taskItem.taskDesc}</div>
        <div className={'achievementTaskitemScore'}>
          {(() => {
            if (taskItem.taskFrequency === 'DAY') {
              return `+${taskItem.taskXpScore}xp/day`;
            } else if (taskItem.taskFrequency === 'ONLY_ONCE') {
              return `+${taskItem.taskXpScore}xp`;
            } else if (taskItem.taskFrequency === 'USER') {
              return `+${taskItem.taskXpScore}xp/user`;
            } else if (taskItem.taskFrequency === 'EVENT') {
              return `+${taskItem.taskXpScore}xp/event`;
            } else if (taskItem.taskFrequency === 'ATTESTATION') {
              return `+${taskItem.taskXpScore}xp/attestation`;
            }
          })()}
        </div>
      </div>
      <PButton
        text="Finish"
        disabled={finished}
        onClick={handleClick}
        className={'achievementTaskitemFinishBtn'}
      /></div>

  );
});

export default AchievementTaskItem;