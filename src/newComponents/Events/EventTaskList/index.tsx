import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import {
  setActiveConnectWallet,
  initSetNewRewardsAction,
  setNewRewards,
} from '@/store/actions';
import { setActiveOnChain, initRewardsActionAsync } from '@/store/actions';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import useEventDetail from '@/hooks/useEventDetail';
import useMsgs from '@/hooks/useMsgs';

import { mintWithSignature } from '@/services/chains/erc721';
import { getEventSignature, getNFTInfo } from '@/services/api/event';
import { eventReport } from '@/services/api/usertracker';
import {
  BASEVENTNAME,
  LINEAEVENTNAME,
  eventMetaMap,
  EARLYBIRDNFTEVENTNAME,
  ETHSIGNEVENTNAME,
} from '@/config/events';
import { EASInfo, CLAIMNFTNETWORKNAME } from '@/config/chain';
import { OPENSEALINK } from '@/config/envConstants';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import PButton from '@/newComponents/PButton';
import SocialTasksDialog from '../SocialTasksDialog';
import AttestationTasks from '../AttestationTasks';
import SubmitOnChain from '@/newComponents/ZkAttestation/SubmitOnChain';
import iconOpenSea from '@/assets/img/events/iconOpenSea.svg';
import './index.scss';


dayjs.extend(utc);

type StepItem = {
  id: string;
  title: string;
  // subTitle: string;
  finished: boolean;
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
    title: 'Follow @primus_labs',
    subTitle: 'Authorize twitter and follow ',
  },
  2: {
    id: '2',
    dataSourceId: 'discord',
    title: 'Join Primus Server',
    subTitle: 'Authorize discord and join',
  },
};

const lineaTaskMap: { [propName: string]: StepItem } = {
  follow: {
    id: 'follow',
    title: 'Follow Primus social medial',
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
    title: 'Follow Primus social medial',
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
    title: 'Complete Attestation Tasks',
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
    title: 'Follow Primus social medial',
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
    title: 'Complete attestation',
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
    title: 'Claim Early Bird NFT ',
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
    title: 'Follow Primus social medial',
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
  const { addMsg } = useMsgs();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;
  const [stepMap, setStepMap] = useState<{ [propName: string]: StepItem }>(
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
  const [chainId, setChainId] = useState<string | number>('');
  const [claiming, setClaiming] = useState<boolean>(false);
  const [givenNFT, setGivenNFT] = useState<boolean>(false);
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const earlyBirdNFTs = useSelector((state: UserState) => state.earlyBirdNFTs);
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const activeOnChain = useSelector((state: UserState) => state.activeOnChain);
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const rewards = useSelector((state: UserState) => state.rewards);

  const stepList: StepItem[] = useMemo(() => {
    const l = Object.values(stepMap);
    return l;
  }, [stepMap]);
  const taskIds = useMemo(() => {
    let l: string[] = [];
    if (eventId === LINEAEVENTNAME || eventId === EARLYBIRDNFTEVENTNAME) {
      return (l = ['Linea Goerli']);
    } else if (eventId === BASEVENTNAME) {
      return ['BSC'];
    } else if (eventId === ETHSIGNEVENTNAME) {
      return ['opBNB'];
    }
    return l;
  }, [eventId]);
  const formatList = useMemo(() => {
    if (taskIds[0] === 'All') {
      const allL = Object.values(EASInfo).map((i: any) => {
        const { title, showName, icon, disabled } = i;
        return {
          id: title,
          name: showName,
          icon,
          disabled,
        };
      });
      return allL;
    }
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
    } else if (eventId === ETHSIGNEVENTNAME) {
      attestation = {
        15: 0, //  x followers
      };
    } else if (eventId === EARLYBIRDNFTEVENTNAME) {
      attestation = {
        'Assets Verification': 0, // asset certification
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
    } else {
      //  have not joined this event
      newEventObj = {
        [currentAddress]: emptyInfo,
      };
    }

    if (eventId == ETHSIGNEVENTNAME) {
      delete newEventObj[currentAddress].taskMap.check;
    } else if (eventId == EARLYBIRDNFTEVENTNAME) {
      delete newEventObj[currentAddress].taskMap.check;
      newEventObj[currentAddress].taskMap.claim = { claim: 0 };

      // const nftFlag = Object.values(rewards).find((r) => !r.type);
      // newEventObj[currentAddress].taskMap.claim = {
      //   claim: nftFlag ? 1 : 0,
      // };
      // setStepMap((m) => {
      //   Object.values(m).forEach((i: any) => {
      //     i.finished = true;
      //   });
      //   return m;
      // });

      // setGivenNFT(true);
      // debugger;
    }

    await chrome.storage.local.set({
      [eventId]: JSON.stringify(newEventObj),
    });
    setVisibleSocialTasksDialog(true);
  }, [connectedWallet?.address, rewards, eventId]);
  const claimEarlyBirdNFT = useCallback(async () => {
    let eventSingnature = '';
    const activeNetworkName = CLAIMNFTNETWORKNAME;
    let attestationId;
    const res = await chrome.storage.local.get([eventId]);
    const currentAddress = connectedWallet?.address;
    if (res[eventId]) {
      const lastEventObj = JSON.parse(res[eventId]);
      const lastInfo = lastEventObj[currentAddress];
      if (lastInfo) {
        const { taskMap } = lastInfo;
        attestationId = Object.values(taskMap.attestation)[0];
      }
    }
    const activeCred = credentialsFromStore[attestationId as string];
    try {
      const requestParams: any = {
        rawParam: activeCred,
        greaterThanBaseValue: true,
        signature: activeCred.signature,
        metamaskAddress: connectedWallet?.address,
      };
      const { rc, result, msg, mc } = await getEventSignature(requestParams);
      if (rc === 0) {
        eventSingnature = result.signature;
        const upChainParams = {
          networkName: activeNetworkName,
          metamaskprovider: connectedWallet?.provider,
          receipt: connectedWallet?.address,
          signature: '0x' + eventSingnature,
        };
        const mintRes = await mintWithSignature(upChainParams);
        setGivenNFT(true);
        const nftInfo = await getNFTInfo(mintRes[1]);
        const tokenId = mintRes[0];
        const claimNFTObj = {
          ...nftInfo,
          tokenId,
          address: connectedWallet?.address,
          title: nftInfo.name,
          desc: nftInfo.description,
          img: nftInfo.image,
          linkIcon: iconOpenSea,
          link: `${OPENSEALINK}/${tokenId}`,
        };
        // const newRewards = { ...rewards };
        // newRewards[mintRes[0]] = { ...nftInfo, tokenId: mintRes[0] };
        const { newRewards } = await chrome.storage.local.get(['newRewards']);
        let newRewardsObj = {};
        const claimAddr = connectedWallet?.address;
        if (newRewards) {
          newRewardsObj = JSON.parse(newRewards);
          if (newRewardsObj[EARLYBIRDNFTEVENTNAME]) {
            newRewardsObj[EARLYBIRDNFTEVENTNAME][claimAddr] = claimNFTObj;
          } else {
            newRewardsObj[EARLYBIRDNFTEVENTNAME] = { [claimAddr]: claimNFTObj };
          }
        } else {
          newRewardsObj = {
            [EARLYBIRDNFTEVENTNAME]: { [claimAddr]: claimNFTObj },
          };
        }
        await chrome.storage.local.set({
          newRewards: JSON.stringify(newRewardsObj),
        });
        await dispatch(setNewRewards(newRewardsObj));
        // setActiveRequest({
        //   type: 'suc',
        //   title: 'Congratulations',
        //   desc: 'Successfully get your rewards.',
        // });

        if (eventId === EARLYBIRDNFTEVENTNAME) {
          const res = await chrome.storage.local.get([eventId]);
          if (res[eventId]) {
            const lastEventObj = JSON.parse(res[eventId]);
            const lastInfo = lastEventObj[currentAddress];
            if (lastInfo) {
              const { taskMap } = lastInfo;
              taskMap.claim['claim'] = 1;
              await chrome.storage.local.set({
                [eventId]: JSON.stringify(lastEventObj),
              });
            }
          }
        }
        setClaiming(false);
        const eventInfo = {
          eventType: 'EVENTS',
          rawData: { name: 'Get on-boarding reward', issuer: 'Primus' },
        };
        eventReport(eventInfo);
      } else {
        if (mc === 'NFT_001') {
          addMsg({
            type: 'info',
            title: 'Cannot claim',
            desc: 'This address has claimed the Early Bird NFT already.',
          });
        } else {
          alert(msg);
        }
        setClaiming(false);
      }
    } catch (e) {
      console.log('claim early bird e:', e);
      setClaiming(false);
    }
  }, [connectedWallet, credentialsFromStore, dispatch]);
  const handleClaim = useCallback(async () => {
    if (claiming) {
      return;
    }
    setClaiming(true);
    setChainId(CLAIMNFTNETWORKNAME);
    await dispatch(
      setActiveConnectWallet({ network: EASInfo[CLAIMNFTNETWORKNAME] })
    );
    setCheckIsConnectFlag(true);
  }, [claiming]);

  const doTask = useCallback(
    async (taskId) => {
      if (taskId === 'follow') {
        initEvent();
      } else if (taskId === 'attestation') {
        if (attestLoading === 1) {
          addMsg({
            type: 'info',
            title: 'Cannot process now',
            desc: 'Another attestation task is running. Please try again later.',
          });
          return;
        } else {
          setVisibleAttestationTasksDialog(true);
        }
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
      } else if (taskId === 'claim') {
        handleClaim();
      }
    },
    [dispatch, eventDetail, initEvent, handleClaim, attestLoading]
  );

  const handleCloseSocialTasksDialog = useCallback(() => {
    setVisibleSocialTasksDialog(false);
  }, []);
  const initTaskStatus = useCallback(async () => {
    const res = await chrome.storage.local.get([eventId]);
    const currentAddress = connectedWallet?.address;
    if (eventId == EARLYBIRDNFTEVENTNAME) {
      if (Object.keys(earlyBirdNFTs).length > 0) {
        setGivenNFT(true);
      }
      // const nftFlag = Object.values(rewards).find((r) => !r.type);
      // if (nftFlag) {
      //   // newStepMap[curr].finished = 1;
      //   // newStepMap['claim'].claim = 1;
      //   setGivenNFT(true);
      // }
    }
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
  }, [connectedWallet?.address, eventId, rewards, earlyBirdNFTs]);
  const handleCloseAttestationTasksDialog = useCallback(() => {
    setVisibleAttestationTasksDialog(false);
  }, []);
  const handleSubmitOnChainDialog = useCallback(() => {
    dispatch(setActiveOnChain({ loading: 0 }));
  }, [dispatch]);

  useEffect(() => {
    if (connected && activeTaskId && !chainId) {
      doTask(activeTaskId);
      setIsConnect(true);
    }
  }, [connected, activeTaskId, chainId]);
  useEffect(() => {
    initTaskStatus();
  }, [initTaskStatus]);
  useEffect(() => {
    if (!visibleSocialTasksDialog) {
      initTaskStatus();
    }
  }, [visibleSocialTasksDialog, initTaskStatus]);
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
  useEffect(() => {
    if (activeOnChain.loading === 0) {
      initTaskStatus();
      if (eventId === EARLYBIRDNFTEVENTNAME) {
        dispatch(initSetNewRewardsAction());
      }
    }
  }, [activeOnChain.loading, initTaskStatus, eventId]);
  useEffect(() => {
    if (chainId && connected) {
      claimEarlyBirdNFT();
      setChainId('');
    }
  }, [chainId, connected]);
  // useEffect(() => {
  //   setStepList(Object.values(stepMap));
  // }, []);
  const btnTxtFn = useCallback(
    (k) => {
      if (k === 3) {
        return eventId === EARLYBIRDNFTEVENTNAME ? 'Claim' : 'Check';
      } else {
        return 'Finish';
      }
    },
    [eventId]
  );
  const btnDisabledFn = useCallback(
    (k) => {
      return k > 0 ? !stepList[k - 1].finished : false;
    },
    [stepList]
  );

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
                {taskStatusMap[i.id] || (k === 3 && givenNFT) ? (
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
                      text={btnTxtFn(k)}
                      type="primary"
                      onClick={() => {
                        handleTask(i, k);
                      }}
                      disabled={givenNFT ? givenNFT : btnDisabledFn(k)}
                      loading={k === 3 && claiming}
                      className="finishBtn"
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
