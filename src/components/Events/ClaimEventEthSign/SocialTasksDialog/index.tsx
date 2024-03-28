import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useJoinDiscord from '@/hooks/useJoinDiscord';
import { DATASOURCEMAP } from '@/config/constants';
import type { UserState } from '@/types/store';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import iconSuc from '@/assets/img/iconSuc.svg';

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
    const eventId = searchParams.get('fromEvents') as string;
    const socialTaskMap = {
      x: {
        id: '1',
        dataSourceId: 'x',
        title: 'Follow @padolabs',
        subTitle: 'Authorize twitter and follow ',
      },
      discord: {
        id: '2',
        dataSourceId: 'discord',
        title: 'Join PADO Server',
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

    const initTaskStatus = useCallback(async () => {
      const res = await chrome.storage.local.get([eventId]);
      const currentAddress = connectedWallet?.address;
      if (res[eventId]) {
        const lastEventObj = JSON.parse(res[eventId]);
        const lastInfo = lastEventObj[currentAddress];
        debugger
        if (lastInfo) {
          setTaskStatusMap({ ...lastInfo.taskMap.follow });
        }
      }
    }, [connectedWallet?.address]);
    const setSocialTaskStatus = useCallback(
      async (k, v = 1) => {
        const res = await chrome.storage.local.get([eventId]);
        const currentAddress = connectedWallet?.address;
        if (res[eventId]) {
          const lastEventObj = JSON.parse(res[eventId]);
          const lastInfo = lastEventObj[currentAddress];
          if (lastInfo) {
            lastInfo.taskMap.follow[k] = v;
            setTaskStatusMap((m) => ({ ...m, [k]: v }));
            await chrome.storage.local.set({
              [eventId]: JSON.stringify(lastEventObj),
            });
          }
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
    
    const handleSubmit = useCallback(() => {
      if (formLegal) {
        onSubmit();
      }
    }, [onSubmit, formLegal]);

    const liClassName = useCallback(
      (item: any) => {
        let defaultCN = 'credTypeItem';
        if (!!taskStatusMap[item.dataSourceId]) {
          defaultCN += ' active';
        }
        if (item.finished) {
          defaultCN += ' excitable';
        }
        return defaultCN;
      },
      [taskStatusMap]
    );

    return (
      <PMask closeable={false}>
        <div className="padoDialog socialTasksDialog">
          <main>
            <header>
              <h1>Follow PADO</h1>
            </header>
            <ul className="credTypeList">
              {questionList.map((item: any) => (
                <li
                  className={liClassName(item)}
                  onClick={() => {
                    handleTask(item);
                  }}
                  key={item.id}
                >
                  <div className="innerContent">
                    <img
                      className="icon"
                      src={DATASOURCEMAP[item.dataSourceId].icon}
                      alt=""
                    />
                    <div className="con">
                      <h5 className="title">{item.title}</h5>
                      <h6 className="desc">{item.subTitle}</h6>
                    </div>
                    {!!taskStatusMap[item.dataSourceId] && (
                      <img src={iconSuc} alt="" className="doneIcon" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </main>
          <PButton
            text="Complete"
            className={`fullWidth confirmBtn ${formLegal ? '' : 'gray'}`}
            onClick={handleSubmit}
            disabled={!formLegal}
          ></PButton>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
