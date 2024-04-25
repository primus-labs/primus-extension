import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import { setActiveOnChain } from '@/store/actions';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import useEventDetail from '@/hooks/useEventDetail';
import {
  SCROLLEVENTNAME,
  BASEVENTNAME,
  LINEAEVENTNAME,
  LUCKYDRAWEVENTNAME,
  eventMetaMap,
  EARLYBIRDNFTEVENTNAME,
  ETHSIGNEVENTNAME,
} from '@/config/events';
import { EASInfo } from '@/config/chain';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import PButton from '@/newComponents/PButton';
import SocialTasksDialog from '../SocialTasksDialog';
import AttestationTasks from '../AttestationTasks';
import SubmitOnChain from '@/newComponents/ZkAttestation/SubmitOnChain';

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
  operationName?: string;
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

const lineaTaskMap: { [propName: string]: StepItem } = {
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
    operationName: 'Check',
  },
};
const basTaskMap: { [propName: string]: StepItem } = {
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
    title: 'Complete zkAttestations',
    finished: false,
    tasksProcess: {
      total: 4,
      current: 0,
    },
  },
  onChain: {
    id: 'onChain',
    title: 'Submit to BNB Chain',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
  check: {
    id: 'check',
    title: 'Go to BAS attestation alliance campaign to earn your BAS XPS',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
    operationName: 'Check',
  },
};
const earlyBirdNftTskMap = {
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
    title: 'Complete an asset certification',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
  onChain: {
    id: 'onChain',
    title: 'Submit on-chain',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
  // share: {
  //   id: 'share',
  //   title: 'Share your referral code',
  //   finished: false,
  //   tasksProcess: {
  //     total: 1,
  //     current: 0,
  //   },
  // },
  claim: {
    id: 'claim',
    title: 'Claim PADO Early Bird NFT ',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
    operationName: 'Claim',
  },
};
const ethSignTaskMap: { [propName: string]: StepItem } = {
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
    title: 'Complete an attestation about your X followers',

    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
  onChain: {
    id: 'onChain',
    title: 'Submit to opBNB',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
};
const eventTaskMap = {
  [BASEVENTNAME]: basTaskMap,
  [LINEAEVENTNAME]: lineaTaskMap,
  [EARLYBIRDNFTEVENTNAME]: earlyBirdNftTskMap,
  [ETHSIGNEVENTNAME]: ethSignTaskMap,
};
const initStatusMap = { follow: 0, attestation: 0, onChain: 0, check: 0 };
const DataSourceItem = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;
  const [stepMap, setStepMap] = useState<any>(
    JSON.parse(JSON.stringify(eventTaskMap[eventId]))
  );
  // let stepMap = JSON.parse(JSON.stringify(eventTaskMap[eventId]));
  const [eventDetail] = useEventDetail(eventId);
  const dispatch: Dispatch<any> = useDispatch();
  const metaInfo = eventMetaMap[eventId];
  const [taskStatusMap, setTaskStatusMap] = useState<TaskStatusMap>({
    ...initStatusMap,
  });
  const [visibleAttestationTasksDialog, setVisibleAttestationTasksDialog] =
    useState<boolean>(false);
  // const [stepList, setStepList] = useState<any[]>([]);
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
  const activeOnChain = useSelector((state: UserState) => state.activeOnChain);
  const stepList = useMemo(() => {
    return Object.values(stepMap);
  }, [stepMap]);
  const taskIds = useMemo(() => {
    let l: string[] = [];
    if (eventId === LINEAEVENTNAME) {
      return (l = ['Linea Goerli']);
    } else if (eventId === BASEVENTNAME) {
      return ['BSC'];
    }
    return l;
  }, [eventId]);
  const formatList = useMemo(() => {
    let l = taskIds.map((i) => {
      const { title, showName, icon, disabled } = EASInfo[i];
      return {
        id: title,
        name: showName,
        icon,
        disabled,
      };
    });
    return l;
  }, [taskIds]);
  const { connected } = useCheckIsConnectedWallet(checkIsConnectFlag);

  const handleTask = useCallback(
    (i, k) => {
      const prevStep = stepList[k - 1];
      if (i.finished || (prevStep && !prevStep.finished)) {
        return;
      }
      if (isConnect) {
        setActiveTaskId(undefined);
        doTask(i.id);
      } else {
        setActiveTaskId(i.id);
        setCheckIsConnectFlag(true);
      }
    },
    [isConnect, stepList]
  );

  const initEvent = useCallback(async () => {
    let newEventObj = {};
    const currentAddress = connectedWallet?.address;
    const res = await chrome.storage.local.get([eventId]);
    let emptyInfo = {};
    let attestation = {};
    if (eventId === LINEAEVENTNAME) {
      attestation = {
        '1': 0, // binance kyc (web tempalte id:1)
      };
    } else if (eventId === BASEVENTNAME) {
      attestation = {
        2: 0, // biance account
        6: 0, // tiktok account
        100: 0, // google account
        3: 0, //  x account
      };
    }
    emptyInfo = {
      address: currentAddress,
      taskMap: {
        follow: {
          x: 0,
          discord: 0,
        },
        attestation,
        onChain: {
          onChain: 0,
        },
        check: {
          check: 0,
        },
      },
    };
    if (eventId == ETHSIGNEVENTNAME) {
      delete emptyInfo.taskMap.check;
    }
    if (res[eventId]) {
      // have joined this event
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
        [currentAddress]: emptyInfo,
      };
      await chrome.storage.local.set({
        [eventId]: JSON.stringify(newEventObj),
      });
    }
    setVisibleSocialTasksDialog(true);
  }, [connectedWallet?.address]);
  const doTask = useCallback(
    async (taskId) => {
      if (taskId === 'follow') {
        initEvent();
      } else if (taskId === 'attestation') {
        setVisibleAttestationTasksDialog(true);
      } else if (taskId === 'onChain') {
        const res = await chrome.storage.local.get([eventId]);
        const currentAddress = connectedWallet?.address;
        if (res[eventId]) {
          const lastEventObj = JSON.parse(res[eventId]);
          const lastInfo = lastEventObj[currentAddress];
          if (lastInfo) {
            const {
              taskMap: { attestation },
            } = lastInfo;
            dispatch(
              setActiveOnChain({
                loading: 1,
                requestid: Object.values(attestation)[0],
              })
            );
          }
        }
      } else if (taskId === 'check') {
        let checkUrl = '';
        if (eventId === LINEAEVENTNAME) {
          checkUrl = eventDetail?.ext?.intractUrl;
        } else if (eventId === BASEVENTNAME) {
          checkUrl = eventDetail?.ext?.claimPointsUrl;
        }
        window.open(checkUrl);
      }
    },
    [dispatch, eventDetail, initEvent]
  );
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
        const newStepMap = { ...stepMap };
        const statusM = Object.keys(taskMap).reduce((prev, curr) => {
          const currTask = taskMap[curr];
          // tasksProcess
          if (currTask) {
            const taskLen = Object.keys(currTask).length;
            const doneTaskLen = Object.values(currTask).filter(
              (i) => !!i
            ).length;
            const allDone = taskLen === doneTaskLen;

            newStepMap[curr].tasksProcess.total = taskLen;
            newStepMap[curr].tasksProcess.current = doneTaskLen;
            newStepMap[curr].finished = allDone;

            prev[curr] = allDone ? 1 : 0;
          }
          return prev;
        }, {});
        setStepMap(newStepMap);
        setTaskStatusMap({ ...statusM });
      } else {
        setStepMap(JSON.parse(JSON.stringify(eventTaskMap[eventId])));
        setTaskStatusMap({ ...initStatusMap });
      }
    }
  }, [connectedWallet?.address]);
  const handleCloseAttestationTasksDialog = useCallback(() => {
    setVisibleAttestationTasksDialog(false);
  }, []);
  const handleSubmitOnChainDialog = useCallback(() => {
    dispatch(setActiveOnChain({ loading: 0 }));
  }, [dispatch]);

  useEffect(() => {
    if (connected) {
      doTask(activeTaskId);
      setIsConnect(true);
    }
  }, [connected, activeTaskId]);
  useEffect(() => {
    initTaskStatus();
  }, [initTaskStatus]);
  useEffect(() => {
    if (!visibleSocialTasksDialog) {
      initTaskStatus();
    }
  }, [visibleSocialTasksDialog]);
  useEffect(() => {
    if (!visibleAttestationTasksDialog) {
      initTaskStatus();
    }
  }, [visibleAttestationTasksDialog, initTaskStatus]);
  useEffect(() => {
    if (attestLoading === 2) {
      // setVisibleAttestationTasksDialog(false);
      initTaskStatus();
    }
  }, [attestLoading, visibleAttestationTasksDialog, initTaskStatus]);
  useEffect(() => {
    if (activeOnChain.loading === 0) {
      initTaskStatus();
    }
  }, [activeOnChain.loading, initTaskStatus]);
  // useEffect(() => {
  //   setStepList(Object.values(stepMap));
  // }, []);

  return (
    <div className="eventTaskList">
      <h2 className="title">Task lists</h2>
      <ul className="eventTasks">
        {stepList.map((i, k) => {
          return (
            <li
              className={`task ${i.finished && 'done'} ${
                k > 0 && !stepList[k - 1].finished && 'disabled'
              }`}
              key={k}
              onClick={() => {
                handleTask(i, k);
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
                    {k !== 3 && (
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
                        handleTask(i, k);
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
      {activeOnChain.loading === 1 && (
        <SubmitOnChain
          list={formatList}
          onClose={handleSubmitOnChainDialog}
          onSubmit={handleSubmitOnChainDialog}
        />
      )}
    </div>
  );
});

export default DataSourceItem;
