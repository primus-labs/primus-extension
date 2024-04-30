import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import './index.scss';
import PButton from '@/newComponents/PButton';
import taskItemIcon from '@/assets/newImg/achievements/taskItemIcon.svg';
import taskFinishedIcon from '@/assets/newImg/achievements/taskFinishedIcon.svg';
import {
  checkHasFinishJoinDiscord,
  finishTask,
  taskStatusCheck,
} from '@/services/api/achievements';
import { getAuthUrl, getCurrentDate, postMsg } from '@/utils/utils';
import { v4 as uuidv4 } from 'uuid';

import {
  SCROLLEVENTNAME,
  BASEVENTNAME,
  LINEAEVENTNAME,
  LUCKYDRAWEVENTNAME,
  ETHSIGNEVENTNAME,
  EARLYBIRDNFTEVENTNAME,
} from '@/config/events';
import { SocailStoreVersion } from '@/config/constants';
import { checkIsLogin } from '@/services/api/user';
import useMsgs from '@/hooks/useMsgs';
import { eventReport } from '@/services/api/usertracker';
import { useSelector } from 'react-redux';
import type { UserState } from '@/types/store';

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
  isConnect: any;
  onConnectWallet: any;
  taskToFinished: string;
};

const AchievementTaskItem: React.FC<TaskItemWithClick> = memo(
  (taskItemWithClick: TaskItemWithClick) => {
    const taskItem = taskItemWithClick.taskItem;
    const showCodeDiag = taskItemWithClick.showCodeDiag;
    const refreshTotalScore = taskItemWithClick.refreshTotalScore;
    const isConnect = taskItemWithClick.isConnect;
    const onConnectWallet = taskItemWithClick.onConnectWallet;
    const taskToFinished = taskItemWithClick.taskToFinished;
    const [finished, setFinished] = useState(taskItemWithClick.isFinished);
    const { msgs, addMsg, deleteMsg } = useMsgs();
    const [btnIsLoading, setBtnIsLoading] = useState(false);

    const [PADOTabId, setPADOTabId] = useState<number>();
    const [xTabId, setXTabId] = useState<number>();
    const connectedWallets = useSelector(
      (state: UserState) => state.connectedWallets
    );
    // useEffect(() => {
    //   const handleAutoTask = async () => {
    //     const windows = await chrome.windows.getAll()
    //     if (
    //       taskToFinished === taskItem.taskIdentifier &&
    //       !taskItemWithClick.isFinished
    //     ) {
    //       handleClick();
    //     }
    //   };
    //   handleAutoTask();
    // }, [taskToFinished]);

    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );

    const getDataSourceData = async (datasource) => {
      const data = await chrome.storage.local.get(datasource);
      console.log(data);
      return data;
    };

    const handleClickFn = async () => {
      if (btnIsLoading) {
        console.log('btnIsLoading', btnIsLoading);
        return;
      }
      setBtnIsLoading(true);
      await handleClick();
      setBtnIsLoading(false);
    };

    const onFollowX = useCallback(async () => {
      const targetUrl =
        'https://twitter.com/intent/follow?screen_name=padolabs';
      const openXUrlFn = async () => {
        const currentWindowTabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        setPADOTabId(currentWindowTabs[0].id);
        const tabCreatedByPado = await chrome.tabs.create({
          url: targetUrl,
        });

        console.log(
          '222123 create tab',
          tabCreatedByPado.id,
          currentWindowTabs[0].id
        );
        setXTabId(tabCreatedByPado.id);
      };
      if (xTabId) {
        try {
          await chrome.tabs.update(xTabId as number, {
            active: true,
          });
          return;
        } catch {
          await openXUrlFn();
          return;
        }
      }
      await openXUrlFn();
    }, [xTabId]);

    useEffect(() => {
      const listerFn = async (message, sender, sendResponse) => {
        console.log('Achievement  onMessage message', message);
        if (message.type === 'xFollow' && message.name === 'follow') {
          try {
            if (xTabId) {
              const xTab = await chrome.tabs.get(xTabId as number);
              if (xTab) {
                setXTabId(undefined);
                if (PADOTabId) {
                  await chrome.tabs.update(PADOTabId, {
                    active: true,
                  });
                  console.log('followed');
                  //if followed
                  const res = await getDataSourceData('x');
                  const xUserInfo = JSON.parse(res['x']);
                  const ext = {
                    uniqueName: xUserInfo.screenName,
                  };
                  const finishBody = {
                    taskIdentifier: taskItem.taskIdentifier,
                    ext: ext,
                  };
                  const resFromServer = await finishTask(finishBody);
                  if (resFromServer.rc === 0) {
                    const msgId = addMsg({
                      type: 'suc',
                      title: `${taskItem.taskXpScore} points earned!`,
                      link: '',
                    });
                    setTimeout(() => {
                      deleteMsg(msgId);
                    }, 5000);

                    setFinished(true);
                    refreshTotalScore(
                      taskItem.taskXpScore,
                      taskItem.taskIdentifier
                    );
                  } else {
                    const msgId = addMsg({
                      type: 'info',
                      title: 'Not qualified',
                      desc: resFromServer.msg,
                    });
                    setTimeout(() => {
                      deleteMsg(msgId);
                    }, 5000);
                  }
                }
                await chrome.tabs.remove(xTabId as number);
              }
            }
          } catch {}
        }
      };
      chrome.runtime.onMessage.addListener(listerFn);
      return () => {
        chrome.runtime.onMessage.removeListener(listerFn);
      };
    }, [xTabId, PADOTabId]);

    const handleClick = async () => {
      if (!isConnect) {
        onConnectWallet();
        return;
      }
      let ext = {};

      if (taskItem.taskIdentifier === 'DAILY_CHECK_IN') {
        ext = {};
      }
      if (taskItem.taskIdentifier === 'DAILY_DISCORD_GM') {
        //check the main wallet whether it has joined discord
        const checkRsp = await checkHasFinishJoinDiscord();
        if (!checkRsp.result.hasJoinDiscord) {
          const msgId = addMsg({
            type: 'info',
            title: 'Not qualified',
            desc: 'Please complete the Join PADO Discord event first.',
            link: '',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        } else if (
          checkRsp.result.hasJoinDiscord &&
          !checkRsp.result.hasSendGm
        ) {
          const msgId = addMsg({
            type: 'info',
            title: 'Not qualified',
            desc: `No GM messages found for ${checkRsp.result.discordName} on PADO Discord.`,
            link: '',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        } else {
          ext = {};
        }
      }
      if (taskItem.taskIdentifier === 'CONNECT_X_DATA') {
        const res = await getDataSourceData('x');
        if (!res['x']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=x',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const xUserInfo = JSON.parse(res['x']);
        console.log(res);
        ext = {
          uniqueName: xUserInfo.screenName,
        };
      }
      if (taskItem.taskIdentifier === 'CONNECT_BITGET_DATA') {
        const res = await getDataSourceData('bitget');
        if (!res['bitget']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=bitget',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const bitgetUserInfo = JSON.parse(res['bitget']);
        console.log(res);
        ext = {
          uniqueName: bitgetUserInfo.userInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_HUOBI_DATA') {
        const res = await getDataSourceData('huobi');
        if (!res['huobi']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=huobi',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const bitgetUserInfo = JSON.parse(res['huobi']);
        console.log(res);
        ext = {
          uniqueName: bitgetUserInfo.userInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_MEXC_DATA') {
        const res = await getDataSourceData('mexc');
        if (!res['mexc']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=mexc',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const bitgetUserInfo = JSON.parse(res['mexc']);
        console.log(res);
        ext = {
          uniqueName: bitgetUserInfo.userInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_GATE_DATA') {
        const res = await getDataSourceData('gate');
        if (!res['gate']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=gate',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const bitgetUserInfo = JSON.parse(res['gate']);
        console.log(res);
        ext = {
          uniqueName: bitgetUserInfo.userInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_BYBIT_DATA') {
        const res = await getDataSourceData('bybit');
        if (!res['bybit']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=bybit',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const bitgetUserInfo = JSON.parse(res['bybit']);
        console.log(res);
        ext = {
          uniqueName: bitgetUserInfo.userInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_KUCOIN_DATA') {
        const res = await getDataSourceData('kucoin');
        if (!res['kucoin']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=kucoin',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const bitgetUserInfo = JSON.parse(res['kucoin']);
        console.log(res);
        ext = {
          uniqueName: bitgetUserInfo.userInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'FOLLOW_PADOLABS') {
        const res = await getDataSourceData('x');
        if (!res['x']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=x',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        await onFollowX();
        console.log(res);
        return;
      }

      if (taskItem.taskIdentifier === 'CONNECT_DISCORD_DATA') {
        const res = await getDataSourceData('discord');
        if (!res['discord']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=discord',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const discordUserInfo = JSON.parse(res['discord']);
        console.log(res);
        ext = {
          uniqueName: discordUserInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_COINBASE_DATA') {
        const res = await getDataSourceData('coinbase');
        if (!res['coinbase']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=coinbase',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const coinbaseUserInfo = JSON.parse(res['coinbase']);
        console.log(res);
        ext = {
          uniqueName: coinbaseUserInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_GOOGLE_ACCOUNT_DATA') {
        const res = await getDataSourceData('google');
        if (!res['google']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=google',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const googleUserInfo = JSON.parse(res['google']);
        console.log(res);
        ext = {
          uniqueName: googleUserInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_GITHUB_DATA') {
        const res = await getDataSourceData('github');
        if (!res['github']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=github',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const githubUserInfo = JSON.parse(res['github']);
        console.log(res);
        ext = {
          uniqueName: githubUserInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'JOIN_PADO_DISCORD') {
        const res = await getDataSourceData('discord');
        let authUrl;
        let needCheckLogin = false;
        const state = uuidv4();
        if (!res['discord']) {
          const { userInfo } = await chrome.storage.local.get(['userInfo']);
          const parseUserInfo = JSON.parse(userInfo);
          authUrl = getAuthUrl({
            source: 'DISCORD',
            state: state,
            token: parseUserInfo.token,
          });
          authUrl =
            authUrl + '&redirectUrl=https://discord.com/invite/K8Uqm5ww';
          needCheckLogin = true;
        } else {
          authUrl = 'https://discord.com/invite/YxJftNRxhh';
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
        let newWindowId;
        chrome.windows.create(windowOptions, (window) => {
          newWindowId = window?.id;
        });
        let checkLoginTimer;
        if (needCheckLogin) {
          checkLoginTimer = setInterval(async () => {
            await checkIsLoginFn(state, 'DISCORD', 'LOGIN');
          }, 1000);
        }
        const checkDiscordTaskTimer = setInterval(async () => {
          //check has join discord
          const res = await getDataSourceData('discord');
          if (!res['discord']) {
            return;
          }
          if (checkLoginTimer) {
            clearInterval(checkLoginTimer);
          }
          const discordUserInfo = JSON.parse(res['discord']);
          ext = {
            name: discordUserInfo.userName,
            discordUserId: discordUserInfo.uniqueId.replace('DISCORD_', ''),
          };
          const finishBody = {
            taskIdentifier: taskItem.taskIdentifier,
            ext: ext,
          };
          const finishCheckRsp = await finishTask(finishBody);
          if (finishCheckRsp.rc === 0) {
            setFinished(true);
            clearInterval(checkDiscordTaskTimer);
            refreshTotalScore(taskItem.taskXpScore, taskItem.taskIdentifier);
          }
        }, 1000);
        chrome.windows.onRemoved.addListener((windowId) => {
          if (windowId === newWindowId) {
            clearInterval(checkDiscordTaskTimer);
            clearInterval(checkLoginTimer);
          }
        });
        return;
      }
      if (taskItem.taskIdentifier === 'SIGN_IN_USING_AN_REFERRAL_CODE') {
        const res = await taskStatusCheck('SIGN_IN_USING_AN_REFERRAL_CODE');
        const rc = res.rc;
        const result = res.result;
        let needShowCodeDiag = true;
        if (rc === 0) {
          needShowCodeDiag = !result['SIGN_IN_USING_AN_REFERRAL_CODE'];
          if (needShowCodeDiag) {
            showCodeDiag(true);
            return;
          } else {
            ext = {};
          }
        } else {
          return;
        }
      }

      if (taskItem.taskIdentifier === 'CAMPAIGN_PARTICIPATION') {
        const accountArr = Object.keys(connectedWallets.metamask);
        let joinedEventIdArr: string[] = [];
        const eventIdArr = [
          SCROLLEVENTNAME,
          BASEVENTNAME,
          LINEAEVENTNAME,
          LUCKYDRAWEVENTNAME,
          ETHSIGNEVENTNAME,
          EARLYBIRDNFTEVENTNAME,
        ];
        for (const eventIdItem of eventIdArr) {
          const res = await chrome.storage.local.get([eventIdItem]);
          if (res[eventIdItem]) {
            const lastEventObj = JSON.parse(res[eventIdItem]);
            accountArr.forEach((addr) => {
              const currentAddress = addr;
              const lastInfo = lastEventObj[currentAddress];
              if (lastInfo) {
                const { taskMap } = lastInfo;
                let requiredTaskMap = { ...taskMap };
                delete requiredTaskMap.check;
                const statusM = Object.keys(requiredTaskMap).reduce(
                  (prev, curr) => {
                    const currTask = taskMap[curr];
                    // tasksProcess
                    if (currTask) {
                      const taskLen = Object.keys(currTask).length;
                      const doneTaskLen = Object.values(currTask).filter(
                        (i) => !!i
                      ).length;
                      const allDone = taskLen === doneTaskLen;
                      prev[curr] = allDone ? 1 : 0;
                    }
                    return prev;
                  },
                  {}
                );

                const f = Object.values(statusM).every((i) => !!i);
                if (f && !joinedEventIdArr.includes(eventIdItem)) {
                  joinedEventIdArr.push(eventIdItem);
                }
              }
            });
          }
        }
        
        joinedEventIdArr = joinedEventIdArr.map((i) => i.toUpperCase());
        ext = {
          events: joinedEventIdArr.join(','),
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_TIKTOK_ACCOUNT_DATA') {
        const res = await getDataSourceData('tiktok');
        if (!res['tiktok']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=tiktok',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const tiktokUserInfo = JSON.parse(res['tiktok']);
        console.log(res);
        ext = {
          uniqueName: tiktokUserInfo.userName,
        };
      }

      if (taskItem.taskIdentifier === 'CONNECT_GOOGLE_ACCOUNT_DATA') {
        const res = await getDataSourceData('google');
        if (!res['google']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=google',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const googleUserInfo = JSON.parse(res['google']);
        console.log(res);
        ext = {
          uniqueName: googleUserInfo.uniqueId,
        };
      }

      if (taskItem.taskIdentifier == 'CONNECT_BINANCE_DATA') {
        const res = await getDataSourceData('binance');
        if (!res['binance']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=binance',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const binanceInfo = JSON.parse(res['binance']);
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
        if (!res['coinbase']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=coinbase',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const coinbaseInfo = JSON.parse(res['coinbase']);
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
        if (!res['okx']) {
          const msgId = addMsg({
            type: 'info',
            title: 'Data not connected',
            desc: 'Go to Data Source page to connect.',
            link: '/datas/data?dataSourceId=okx',
            linkText: 'To connect',
          });
          setTimeout(() => {
            deleteMsg(msgId);
          }, 5000);
          return;
        }
        const okxInfo = JSON.parse(res['okx']);
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
        const points =
          res.result.points !== 0 ? res.result.points : taskItem.taskXpScore;
        const msgId = addMsg({
          type: 'suc',
          title: `${points} points earned!`,
          desc: taskItem.taskDesc,
          link: '',
        });
        setTimeout(() => {
          deleteMsg(msgId);
        }, 5000);
        setFinished(true);
        refreshTotalScore(points, taskItem.taskIdentifier);
      } else {
        const mc = res.mc;
        const msgFromServer = res.msg;
        let title;
        let msg;
        let link;
        let linkText;
        if (mc === '-110007') {
          title = 'Not qualified';
          const res = await getDataSourceData('discord');
          const discordInfo = JSON.parse(res['discord']);
          msg = `No GM messages found for ${discordInfo.userName} on PADO Discord.`;
        }

        if (mc === '-1100012') {
          title = 'Not qualified';
          msg = msgFromServer;
        }

        if (mc === '-110008') {
          title = 'No new event participated';
          msg = 'Go to Events page to participate.';
          link = '/events';
          linkText = 'View details';
        }
        if (mc === '-110009') {
          title = 'No attestation created';
          msg = 'Go to zkAttestation page to create.';
          link = '/zkAttestation';
          linkText = 'View details';
        }

        if (mc === '-110010') {
          title = 'No new attestation submitted';
          msg = 'Go to zkAttestation page to submit.';
          link = '/zkAttestation';
          linkText = 'View details';
        }

        if(mc === '-110010' && taskItem.taskIdentifier === "REFER_TO_NEW_USER_SUBMIT_FIRST_ATTESTATION"){
          title = 'Not qualified';
          msg = 'No new counted referrals.';
          link = '';
          linkText = '';
        }

        if (mc === '-110011') {
          title = 'Not qualified';
          msg = 'No new counted referrals.';
        }

        const msgId = addMsg({
          type: 'info',
          title: title,
          desc: msg,
          link: link,
          linkText: linkText,
        });
        setTimeout(() => {
          deleteMsg(msgId);
        }, 5000);
      }
    };

    const checkIsLoginFn = async (state, source, data_type) => {
      const res = await checkIsLogin({
        state: state,
        source: source,
        data_type: data_type,
      });
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
          <i
            className={`iconfont ${taskItem.taskIcon} achievementTaskitemIcon`}
          ></i>
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
        {finished ? (
          <div className={'achievementFinishedIcon'}>
            <img src={taskFinishedIcon} />
          </div>
        ) : (
          <PButton
            text="Finish"
            onClick={handleClickFn}
            className={'achievementTaskitemFinishBtn'}
            loading={btnIsLoading}
          />
        )}
      </div>
    );
  }
);

export default AchievementTaskItem;
