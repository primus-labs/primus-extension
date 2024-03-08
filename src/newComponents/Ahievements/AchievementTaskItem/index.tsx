import React, { memo, useEffect, useState } from 'react';

import './index.scss';
import PButton from '@/newComponents/PButton';
import taskItemIcon from '@/assets/newImg/achievements/taskItemIcon.svg';
import taskFinishedIcon from '@/assets/newImg/achievements/taskFinishedIcon.svg';
import { finishTask } from '@/services/api/achievements';
import { getAuthUrl, getCurrentDate, postMsg } from '@/utils/utils';
import { v4 as uuidv4 } from 'uuid';
import { SocailStoreVersion } from '@/config/constants';
import { checkIsLogin } from '@/services/api/user';
import useMsgs from '@/hooks/useMsgs';

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
  referralCode: string;
  refreshTotalScore: any;
};


const AchievementTaskItem: React.FC<TaskItemWithClick> = memo((taskItemWithClick: TaskItemWithClick) => {
  const taskItem = taskItemWithClick.taskItem;
  const showCodeDiag = taskItemWithClick.showCodeDiag;
  const refreshTotalScore = taskItemWithClick.refreshTotalScore;
  const [finished, setFinished] = useState(taskItemWithClick.isFinished);
  const { msgs, addMsg } = useMsgs();
  const [btnIsLoading,setBtnIsLoading] = useState(false)

  const getDataSourceData = async (datasource) => {
    const data = await chrome.storage.local.get(datasource);
    console.log(data);
    return data;
  };


  const handleClickFn = async ()=>{
    if(btnIsLoading){
      console.log('btnIsLoading',btnIsLoading)
      return;
    }
    setBtnIsLoading(true)
    await handleClick()
    setBtnIsLoading(false)
  }

  const handleClick = async () => {
    let ext = {};

    if (taskItem.taskIdentifier === 'DAILY_CHECK_IN') {
      ext = {};
    }
    if (taskItem.taskIdentifier === 'DAILY_DISCORD_GM') {
      const res = await getDataSourceData('discord');
      if (!res.discord) {
        addMsg({
          type: 'info',
          title: 'Not qualified',
          desc: 'Please connect discord data.',
          link: "/datas/data?dataSourceId=discord",
          linkText: 'View details',
        });
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
        addMsg({
          type: 'info',
          title: 'Not qualified',
          desc: 'Please connect x data.',
          link: "/datas/data?dataSourceId=x",
          linkText: 'View details',
        });
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
        addMsg({
          type: 'info',
          title: 'Not qualified',
          desc: 'Please connect discord data.',
          link: "/datas/data?dataSourceId=discord",
          linkText: 'View details',
        });
        return;
      }
      const discordUserInfo = JSON.parse(res.discord);
      console.log(res);
      ext = {
        uniqueName: discordUserInfo.userName,
      };
    }

    if (taskItem.taskIdentifier === 'JOIN_PADO_DISCORD') {
      const res = await getDataSourceData('discord');
      let authUrl;
      let needCheckLogin = false;
      const state = uuidv4();
      if (!res.discord) {
        const { userInfo } = await chrome.storage.local.get(['userInfo']);
        const parseUserInfo = JSON.parse(userInfo);
        authUrl = getAuthUrl({
          source: 'DISCORD',
          state: state,
          token: parseUserInfo.token,
        });
        authUrl = authUrl+"&redirectUrl=https://discord.com/invite/K8Uqm5ww"
        needCheckLogin = true;
      } else {
        authUrl = 'https://discord.com/invite/K8Uqm5ww';
      }
      var width = 520;
      var height = 620;
      const windowScreen: Screen = window.screen;
      var left = Math.round(windowScreen.width / 2 - width / 2);
      var top = Math.round(windowScreen.height / 2 - height / 2);
      const windowOptions: chrome.windows.CreateData = {
        url: authUrl,
        type: 'popup',
        focused: true,
        // setSelfAsOpener: false,
        top,
        left,
        width,
        height,
      };
      await chrome.windows.create(windowOptions);
      let checkLoginTimer;
      if (needCheckLogin) {
        checkLoginTimer = setInterval(async () => {
          await checkIsLoginFn(state, 'DISCORD', 'LOGIN');
        }, 1000);
      }
      const checkDiscordTaskTimer = setInterval(async () => {
        //check has join discord
        const res = await getDataSourceData('discord');
        if (!res.discord) {
          return;
        }
        if(checkLoginTimer){
          clearInterval(checkLoginTimer);
        }
        const discordUserInfo = JSON.parse(res.discord);
        ext = {
          discordUserId: discordUserInfo.uniqueId.replace('DISCORD_', ''),
        };
        const finishBody = {
          taskIdentifier: taskItem.taskIdentifier,
          ext: ext,
        };
        const finishCheckRsp = await finishTask(finishBody);
        if (finishCheckRsp.rc === 0) {
          setFinished(true);
          clearInterval(checkDiscordTaskTimer)
          refreshTotalScore(taskItem.taskXpScore, taskItem.taskIdentifier);
        }
      },1000)
      return;
    }
    if (taskItem.taskIdentifier === 'SIGN_IN_USING_AN_REFERRAL_CODE') {
      showCodeDiag(true);
      return;
    }

    if (taskItem.taskIdentifier === 'CAMPAIGN_PARTICIPATION') {
      ext = {};
    }

    if (taskItem.taskIdentifier === 'CONNECT_TIKTOK_ACCOUNT_DATA') {
      const res = await getDataSourceData('tiktok');
      if (!res.tiktok) {
        addMsg({
          type: 'info',
          title: 'Not qualified',
          desc: 'Please connect tiktok data.',
          link: "/datas/data?dataSourceId=tiktok",
          linkText: 'View details',
        });
        return;
      }
      const tiktokUserInfo = JSON.parse(res.tiktok);
      console.log(res);
      ext = {
        uniqueName: tiktokUserInfo.userName,
      };
    }

    if (taskItem.taskIdentifier === 'CONNECT_GOOGLE_ACCOUNT_DATA') {
      const res = await getDataSourceData('google');
      if (!res.google) {
        addMsg({
          type: 'info',
          title: 'Not qualified',
          desc: 'Please connect google data.',
          link: "/datas/data?dataSourceId=google",
          linkText: 'View details',
        });
        return;
      }
      const googleUserInfo = JSON.parse(res.google);
      console.log(res);
      ext = {
        uniqueName: googleUserInfo.uniqueId,
      };
    }

    if (taskItem.taskIdentifier == 'CONNECT_BINANCE_DATA') {
      const res = await getDataSourceData('binance');
      if (!res.binance) {
        addMsg({
          type: 'info',
          title: 'Not qualified',
          desc: 'Please connect binance data.',
          link: "/datas/data?dataSourceId=binance",
          linkText: 'View details',
        });
        return;
      }
      const binanceInfo = JSON.parse(res.binance);
      debugger
      if (binanceInfo.userInfo) {
        ext = {
          uniqueName: binanceInfo.userInfo,
        };
      } else {
        ext = {
          uniqueName: 'binance',
        };
      }
    }

    if (taskItem.taskIdentifier == 'CONNECT_COINBASE_DATA') {
      const res = await getDataSourceData('coinbase');
      if (!res.coinbase) {
        addMsg({
          type: 'info',
          title: 'Not qualified',
          desc: 'Please connect coinbase data.',
          link: "/datas/data?dataSourceId=coinbase",
          linkText: 'View details',
        });
        return;
      }
      const coinbaseInfo = JSON.parse(res.coinbase);
      if (coinbaseInfo.userInfo) {
        ext = {
          uniqueName: coinbaseInfo.userInfo,
        };
      } else {
        ext = {
          uniqueName: 'coinbase',
        };
      }
    }

    if (taskItem.taskIdentifier === 'CONNECT_OKX_DATA') {
      const res = await getDataSourceData('okx');
      if (!res.okx) {
        addMsg({
          type: 'info',
          title: 'Not qualified',
          desc: 'Please connect okx data.',
          link: "/datas/data?dataSourceId=okx",
          linkText: 'View details',
        });
        return;
      }
      const okxInfo = JSON.parse(res.okx);
      debugger
      if (okxInfo.userInfo) {
        ext = {
          uniqueName: okxInfo.userInfo,
        };
      } else {
        ext = {
          uniqueName: 'okx',
        };
      }
    }

    const finishBody = {
      taskIdentifier: taskItem.taskIdentifier,
      ext: ext,
    };
    const res = await finishTask(finishBody);
    if (res.rc === 0) {
      addMsg({
        type: 'suc',
        title: `${taskItem.taskXpScore} points earned!`,
        link: '',
      });
      setFinished(true);
      refreshTotalScore(taskItem.taskXpScore, taskItem.taskIdentifier);
    } else {
      addMsg({
        type: 'info',
        title: 'Not qualified',
        desc: res.msg,
      });
    }
  };

  const checkIsLoginFn = async (state, source, data_type) => {

    const res = await checkIsLogin({ state: state, source: source, data_type: data_type });
    const rc = res.rc;
    const result = res.result;
    if (rc === 0) {
      const { dataInfo, userInfo } = result;
      const lowerCaseSourceName = source.toLowerCase();
      const socialSourceData = {
        ...dataInfo,
        date: getCurrentDate(),
        timestamp: +new Date(),
        version: SocailStoreVersion,
      };
      socialSourceData.userInfo = {};
      socialSourceData.userInfo.userName = socialSourceData.userName;
      await chrome.storage.local.set({
        [lowerCaseSourceName]: JSON.stringify(socialSourceData),
      });
    }
  };


  return (
    <div className="achievementTaskitem">
      <div className={'achievementTaskitemText'}>
        <img className={'achievementTaskitemIcon'} src={taskItem.taskIcon}></img>
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
      {
        finished ? <div className={'achievementFinishedIcon'}><img src={taskFinishedIcon} /></div> : <PButton
          text="Finish"
          onClick={handleClickFn}
          className={'achievementTaskitemFinishBtn'}
          loading={btnIsLoading}
        />
      }


    </div>

  );
});

export default AchievementTaskItem;