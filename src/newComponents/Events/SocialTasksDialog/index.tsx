import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useJoinDiscord from '@/hooks/useJoinDiscord';
import { DATASOURCEMAP } from '@/config/dataSource';
import type { UserState } from '@/types/store';
import PMask from '@/newComponents/PMask';
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';
import iconCircleSuc from '@/assets/newImg/layout/iconCircleSuc.svg';
import './index.scss';

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}
type TaskStatusMap = {
  x: number;
  discord: number;
};
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    const authorize = useJoinDiscord();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('id') as string;
    const socialTaskMap = {
      x: {
        id: '1',
        dataSourceId: 'x',
        title: 'Follow @primus_labs',
        subTitle: 'Authorize twitter and follow ',
      },
      discord: {
        id: '2',
        dataSourceId: 'discord',
        title: 'Join Primus Server',
        subTitle: 'Authorize discord and join',
      },
    };
    const [questionList, setQuestionList] = useState<any[]>(
      Object.values(socialTaskMap)
    );
    const [taskStatusMap, setTaskStatusMap] = useState<TaskStatusMap>({
      x: 0,
      discord: 0,
    });
    const [xTabId, setXTabId] = useState<number>();
    const [PADOTabId, setPADOTabId] = useState<number>();
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const formLegal = useMemo(() => {
      return Object.values(taskStatusMap).every((i) => !!i);
    }, [taskStatusMap]);

    const onFollowX = useCallback(async () => {
      const targetUrl =
        'https://x.com/intent/follow?screen_name=padolabs';
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

    const initTaskStatus = useCallback(async () => {
      const res = await chrome.storage.local.get([eventId]);
      const currentAddress = connectedWallet?.address;
      if (res[eventId]) {
        const lastEventObj = JSON.parse(res[eventId]);
        const lastInfo = lastEventObj[currentAddress];
        setTaskStatusMap({ ...lastInfo.taskMap.follow });
      }
    }, [connectedWallet?.address]);
    const setSocialTaskStatus = useCallback(
      async (k, v = 1) => {
        const res = await chrome.storage.local.get([eventId]);
        const currentAddress = connectedWallet?.address;
        if (res[eventId]) {
          const lastEventObj = JSON.parse(res[eventId]);
          const lastInfo = lastEventObj[currentAddress];
          lastInfo.taskMap.follow[k] = v;
          setTaskStatusMap((m) => ({ ...m, [k]: v }));
          await chrome.storage.local.set({
            [eventId]: JSON.stringify(lastEventObj),
          });
        }
      },
      [connectedWallet, eventId]
    );
    const handleTask = useCallback(
      (i) => {
        if (!!taskStatusMap[i.dataSourceId]) {
          return;
        }
        if (i.dataSourceId === 'x') {
          // setQuestionList(Object.values(socialTaskMap));
          onFollowX();
        } else if (i.dataSourceId === 'discord') {
          authorize(i.dataSourceId.toUpperCase(), () => {
            setSocialTaskStatus('discord');
          });
        }
      },
      [onFollowX, setSocialTaskStatus, taskStatusMap]
    );
    useEffect(() => {
      const listerFn = async (message, sender, sendResponse) => {
        if (message.type === 'xFollow' && message.name === 'follow') {
          console.log(`Claim ${eventId} onMessage follow message`, message);
          setSocialTaskStatus('x');
          console.log('222123tabdId', xTabId);
          try {
            if (xTabId) {
              const xTab = await chrome.tabs.get(xTabId as number);
              if (xTab) {
                setXTabId(undefined);
                if (PADOTabId) {
                  await chrome.tabs.update(PADOTabId, {
                    active: true,
                  });
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
    }, [xTabId, PADOTabId, eventId, setSocialTaskStatus]);

    useEffect(() => {
      initTaskStatus();
    }, [initTaskStatus]);

    return (
      <PMask>
        <div className="pDialog2 socialTasksDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Follow PADO</h1>
            </header>
            <ul className="socialTasks">
              {questionList.map((i, k) => {
                return (
                  <li
                    className={`task ${
                      !!taskStatusMap[i.dataSourceId] && 'done'
                    }`}
                    key={k}
                    onClick={() => {
                      handleTask(i);
                    }}
                  >
                    <div className="left">
                      <div className="iconWrapper">
                        <img
                          src={DATASOURCEMAP[i.dataSourceId].icon}
                          alt=""
                          className="dataSourceIcon"
                        />
                        {!!taskStatusMap[i.dataSourceId] && (
                          <img
                            src={iconCircleSuc}
                            alt=""
                            className="circleSucIcon"
                          />
                        )}
                      </div>
                      <div className="titleWrapper">
                        <div className="title">{i.title}</div>
                        <div className="subTitle">{i.subTitle}</div>
                      </div>
                    </div>
                    {/* <div className="right">
                      <PButton
                        text="Finish"
                        type="text"
                        onClick={() => {
                          handleTask(i);
                        }}
                      />
                    </div> */}
                  </li>
                );
              })}
            </ul>
            <PButton
              text="Complete"
              className="fullWidth confirmBtn"
              onClick={onSubmit}
              disabled={!formLegal}
            ></PButton>
          </main>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
