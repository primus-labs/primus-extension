import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';

import useAuthorization from '@/hooks/useAuthorization';
import {
  setSocialSourcesAsync,
  setConnectWalletDialogVisibleAction,
} from '@/store/actions';
import { DATASOURCEMAP } from '@/config/dataSource';
import {
  SCROLLEVENTNAME,
  BASEVENTNAME,
  LINEAEVENTNAME,
  LUCKYDRAWEVENTNAME,
  eventMetaMap,
} from '@/config/events';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import PButton from '@/newComponents/PButton';
import SocialTasksDialog from '../SocialTasksDialog';
import AttestationTasks from '../AttestationTasks';

import './index.scss';

dayjs.extend(utc);

type StepItem = {
  id: string;
  title: string;
  // subTitle: string;
  finished?: boolean;
  extra?: string;
  tasksProcess?: any;
  tasks?: any;
};
type TaskStatusMap = {
  [propName: string]: number;
};
const socialTaskMap = {
  1: {
    id: '1',
    dataSourceId: 'x',
    title: 'Follow @padolabs',
    subTitle: 'Authorize twitter and follow ',
  },
  2: {
    id: '2',
    dataSourceId: 'discord',
    title: 'Join PADO Server',
    subTitle: 'Authorize discord and join',
  },
};
const attestationTaskMap = {};
const stepMap: { [propName: string]: StepItem } = {
  follow: {
    id: 'follow',
    title: 'Follow PADO social medial',
    finished: false,
    tasksProcess: {
      total: 2,
      current: 0,
    },
    tasks: {
      1: socialTaskMap[1],
      2: socialTaskMap[2],
    },
  },
  attestation: {
    id: 'attestation',
    title: 'Complete an attestation with a KYCed account on Binance',

    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
  onChain: {
    id: 'onChain',
    title: 'Submit to Linea',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
  check: {
    id: 'check',
    title: 'Go to Linea event page to check your status',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
};
const stepList: StepItem[] = Object.values(stepMap);

const DataSourceItem = memo(() => {
  const [taskStatusMap, setTaskStatusMap] = useState<TaskStatusMap>({
    follow: 0,
    attestation: 0,
    onChain: 0,
    check: 0,
  });
  const [visibleAttestationTasksDialog, setVisibleAttestationTasksDialog] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string>();

  const [visibleSocialTasksDialog, setVisibleSocialTasksDialog] =
    useState<boolean>(false);
  const [checkIsConnectFlag, setCheckIsConnectFlag] = useState<boolean>(false);
  const [isConnect, setIsConnect] = useState<boolean>(false);
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const { connected } = useCheckIsConnectedWallet(checkIsConnectFlag);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;

  // const webProofTypes = useSelector((state: UserState) => state.webProofTypes);

  const dispatch: Dispatch<any> = useDispatch();
  const metaInfo = eventMetaMap[eventId];
  const handleTask = useCallback(
    (i) => {
      debugger
      if (i.finished) {
        return;
      }
      if (isConnect) {
        doTask(i.id);
      } else {
        setActiveTaskId(i.id);
        setCheckIsConnectFlag(true);
      }
    },
    [isConnect]
  );
  const doTask = useCallback((taskId) => {
    if (taskId === 'follow') {
      initEvent();
    } else if (taskId === 'attestation') {
      setVisibleAttestationTasksDialog(true);
    } else if (taskId === 'onChain') {
    }
  }, []);
  const initEvent = async () => {
    let newEventObj = {};
    const currentAddress = connectedWallet?.address;
    const res = await chrome.storage.local.get([eventId]);
    let emptyInfo = {};
    if (eventId === LINEAEVENTNAME) {
      emptyInfo = {
        address: currentAddress,
        taskMap: {
          follow: {
            x: 0,
            discord: 0,
          },
          attestation: {
            '1': 0, // binance kyc (web tempalte id:1)
          },
          onChain: {
            onChain: 0,
          },
          check: {
            check: 0,
          },
        },
      };
    }

    // have joined this event
    if (res[eventId]) {
      const lastEventObj = JSON.parse(res[eventId]);
      // have joined this event by current connected address
      if (lastEventObj[currentAddress]) {
        setVisibleSocialTasksDialog(true);
        return;
      } else {
        // have joined ,but not by current connected address
        newEventObj = { ...lastEventObj };
        newEventObj[currentAddress] = emptyInfo;
      }
      await chrome.storage.local.set({
        [eventId]: JSON.stringify(newEventObj),
      });
    } else {
      //  have not joined this event
      newEventObj = {
        currentAddress: emptyInfo,
      };
      await chrome.storage.local.set({
        [eventId]: JSON.stringify(newEventObj),
      });
    }
    setVisibleSocialTasksDialog(true);
  };
  const handleCloseSocialTasksDialog = useCallback(() => {
    setVisibleSocialTasksDialog(false);
  }, []);
  const initTaskStatus = useCallback(async () => {
    const res = await chrome.storage.local.get([eventId]);
    const currentAddress = connectedWallet?.address;
    if (res[eventId]) {
      const lastEventObj = JSON.parse(res[eventId]);
      const lastInfo = lastEventObj[currentAddress];
      if (lastInfo) {
        const { taskMap } = lastInfo;
        const statusM = Object.keys(taskMap).reduce((prev, curr) => {
          const currTask = taskMap[curr];
          // tasksProcess
          if (currTask) {
            const taskLen = Object.keys(currTask).length;
            const doneTaskLen = Object.values(currTask).filter(
              (i) => !!i
            ).length;
            const allDone = taskLen === doneTaskLen;

            stepMap[curr].tasksProcess.total = taskLen;
            stepMap[curr].tasksProcess.current = doneTaskLen;
            stepMap[curr].finished = allDone;

            prev[curr] = allDone ? 1 : 0;
          }
          return prev;
        }, {});
        setTaskStatusMap({ ...statusM });
      }
    }
  }, [connectedWallet?.address]);
  const handleCloseAttestationTasksDialog = useCallback(() => {
    setVisibleAttestationTasksDialog(false)
  }, []);
  
  useEffect(() => {
    if (connected) {
      doTask(activeTaskId);
      setIsConnect(true);
    }
  }, [connected, activeTaskId]);

  useEffect(() => {
    if (!visibleSocialTasksDialog || !visibleAttestationTasksDialog) {
      initTaskStatus();
    }
  }, [visibleSocialTasksDialog, visibleAttestationTasksDialog]);
  
  return (
    <div className="eventTaskList">
      <h2 className="title">Task lists</h2>
      <ul className="tasks">
        {stepList.map((i, k) => {
          return (
            <li
              className="task"
              key={k}
              onClick={() => {
                handleTask(i);
              }}
            >
              <div className="left">
                <div className="order">Task {k + 1}</div>
                <div className="title">{i.title}</div>
              </div>

              <div className="right">
                {taskStatusMap[i.id] ? (
                  <i className="iconfont icon-iconResultSuc"></i>
                ) : (
                  <>
                    {i.tasksProcess && (
                      <div className="process">
                        <div className="txt">
                          {i.tasksProcess.current}/{i.tasksProcess.total}
                        </div>
                        <div className="bar">
                          <div
                            className="current"
                            style={{
                              width: `${
                                (i.tasksProcess.current /
                                  i.tasksProcess.total) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <PButton
                      text={k === 3 ? 'Check' : 'Finish'}
                      type="primary"
                      onClick={() => {
                        handleTask(i);
                      }}
                      disabled={k > 0 ? !stepList[k - 1].finished : false}
                    />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {visibleSocialTasksDialog && (
        <SocialTasksDialog
          onClose={handleCloseSocialTasksDialog}
          onSubmit={handleCloseSocialTasksDialog}
        />
      )}

      {visibleAttestationTasksDialog && (
        <AttestationTasks
          onClose={handleCloseAttestationTasksDialog}
          onSubmit={handleCloseAttestationTasksDialog}
        />
      )}
    </div>
  );
});

export default DataSourceItem;
