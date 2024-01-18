import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  DATASOURCEMAP,
  SCROLLEVENTNAME,
  BASEVENTNAME,
} from '@/config/constants';

import PButton from '@/components/PButton';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import CredList from '@/components/Cred/CredList';
import QRCodeDialog from '@/components/Cred/QRCodeDialog';
import DataAddBar from '@/components/DataSourceOverview/DataAddBar';
import BindPolygonID from '@/components/Cred/BindPolygonID';
import CredSendToChainWrapper from '../CredSendToChainWrapper';
import ClaimMysteryBoxWrapper2 from '@/components/Events/ClaimMysteryBoxWrapper2';
import ClaimEventBAS from '@/components/Events/ClaimBAS';
import useWallet from '@/hooks/useWallet';
import { setCredentialsAsync } from '@/store/actions';

import { postMsg } from '@/utils/utils';
import { GOOGLEWEBPROOFID } from '@/config/constants';
import type { Dispatch } from 'react';
import type { CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { ActiveRequestType } from '@/types/config';
import type { WALLETITEMTYPE } from '@/types/config';
import CredAddWrapper from '../CredAddWrapper';
import './index.scss';
import ConnectWalletDialog from '../CredSendToChainWrapper/ConnectWalletDialog';

const CredOverview = memo(() => {
  const navigate = useNavigate();
  const [eventSource, setEventSource] = useState<string>();
  const [claimMysteryBoxVisible2, setClaimMysteryBoxVisible2] =
    useState<boolean>(false);
  const [claimEventBASVisible, setClaimEventBASVisible] =
    useState<boolean>(false);
  const [claimEventBASStep, setClaimEventBASStep] = useState<number>(1);
  const [connectDialogVisible, setConnectDialogVisible] = useState<boolean>();
  const [connectTipDialogVisible, setConnectTipDialogVisible] =
    useState<boolean>();
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const [activeSourceName, setActiveSourceName] = useState<string>();
  const [addDialogVisible, setAddDialogVisible] = useState<boolean>(false);
  const [sendToChainDialogVisible, setSendToChainDialogVisible] =
    useState<boolean>(false);
  const [bindPolygonidVisible, setBindPolygonidVisible] =
    useState<boolean>(false);
  const [qrcodeVisible, setQrcodeVisible] = useState<boolean>(false);
  const [activeCred, setActiveCred] = useState<CredTypeItemType>();
  const [searchParams] = useSearchParams();
  const createFlag = searchParams.get('createFlag')?.toLowerCase();
  const proofType: any = searchParams.get('proofType');
  const fromEvents = searchParams.get('fromEvents');

  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector((state: UserState) => state.filterWord);
  const proofTypes = useSelector((state: UserState) => state.proofTypes);
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
  );
  const dispatch: Dispatch<any> = useDispatch();

  const errorDescEl = useMemo(
    () => (
      <>
        <p>Your wallet did not connect or refused to authorize.</p>
        <p>Please try again later.</p>
      </>
    ),
    []
  );
  const credList: CredTypeItemType[] = useMemo(() => {
    let credArr: CredTypeItemType[] = Object.values(credentialsFromStore);
    credArr = credArr.sort(
      (a: CredTypeItemType, b: CredTypeItemType) =>
        Number(a.getDataTime) - Number(b.getDataTime)
    );
    return credArr;
  }, [credentialsFromStore]);
  const filteredCredList: CredTypeItemType[] = useMemo(() => {
    let activeList = credList;
    if (activeSourceType && activeSourceType !== 'All') {
      activeList = activeList.filter((i) => {
        const curProofTypeItem = proofTypes.find(
          (j: any) => j.credIdentifier === i.type
        );
        return curProofTypeItem?.simplifiedName === activeSourceType;
      });
    }
    if (filterWord) {
      activeList = activeList.filter((i) =>
        i.source.toLowerCase().startsWith(filterWord)
      );
    }
    return activeList;
  }, [credList, activeSourceType, filterWord, proofTypes]);
  const proofX = useMemo(() => {
    let credArr = Object.values(credentialsFromStore);

    const haveXProof = credArr.find(
      (i: any) => i.event === SCROLLEVENTNAME && i.source === 'x'
    );
    return haveXProof;
  }, [credentialsFromStore]);
  const proofBinance = useMemo(() => {
    let credArr = Object.values(credentialsFromStore);
    const haveBinanceProof = credArr.find(
      (i: any) => i?.event === SCROLLEVENTNAME && i.source === 'binance'
    );
    return haveBinanceProof;
  }, [credentialsFromStore]);
  const handleCloseConnectTipDialog = useCallback(() => {
    setConnectTipDialogVisible(false);
    if (fromEvents === 'Scroll') {
      navigate('/events');
    }
    if (fromEvents === 'LINEA_DEFI_VOYAGE' || fromEvents === 'NFTs') {
      navigate('/cred');
    }
  }, [fromEvents, navigate]);

  const LINEA_DEFI_VOYAGETryAgainFn = useCallback(() => {
    // handleCloseConnectTipDialog();
    const msg = {
      fullScreenType: 'algorithm',
      reqMethodName: 'stop',
      params: {
        noRestart: true,
      },
    };
    postMsg(padoServicePort, msg);
    navigate('/cred?fromEvents=LINEA_DEFI_VOYAGE');
    window.location.reload();
  }, [navigate, padoServicePort]);
  const footerButton = useMemo(() => {
    if (activeRequest?.type !== 'suc') {
      if (fromEvents === 'LINEA_DEFI_VOYAGE') {
        return (
          <PButton
            text="Try again"
            className="gray"
            onClick={LINEA_DEFI_VOYAGETryAgainFn}
          />
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  }, [fromEvents, activeRequest?.type, LINEA_DEFI_VOYAGETryAgainFn]);
  const initCredList = useCallback(async () => {
    await dispatch(setCredentialsAsync());
  }, [dispatch]);

  const handleUpChain = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setSendToChainDialogVisible(true);
  }, []);
  const handleViewQrcode = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setQrcodeVisible(true);
  }, []);
  const handleBindPolygonID = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setBindPolygonidVisible(true);
  }, []);
  const handleCloseQrcode = useCallback(() => {
    setQrcodeVisible(false);
  }, []);
  const handleCloseBindPolygonid = useCallback(() => {
    setBindPolygonidVisible(false);
  }, []);
  const handleDeleteCred = useCallback(
    async (item: CredTypeItemType) => {
      const curRequestid = item.requestid;
      const cObj = { ...credentialsFromStore };
      if (cObj[curRequestid]?.event === BASEVENTNAME) {
        const res = await chrome.storage.local.get([BASEVENTNAME]);
        if (res[BASEVENTNAME]) {
          const lastInfo = JSON.parse(res[BASEVENTNAME]);
          const { steps } = lastInfo;
          if (steps[2]?.status !== 1) {
            let newInfo = { ...lastInfo };
            const credTasks = steps[1]?.tasks;
            let newCredTasks = { ...credTasks };
            let newCredTasksStatus = steps[1]?.status;
            let webTemplateId;
            Object.keys(credTasks).forEach((k) => {
              if (credTasks[k] === item.requestid) {
                webTemplateId = k;
              }
            });

            delete newCredTasks[webTemplateId];
            newCredTasksStatus = Object.values(newCredTasks).length > 0 ? 1 : 0;
            newInfo.steps[1] = {
              status: newCredTasksStatus,
              tasks: newCredTasks,
            };
            await chrome.storage.local.set({
              [BASEVENTNAME]: JSON.stringify(newInfo),
            });
          }
        }
      }
      delete cObj[curRequestid];
      await chrome.storage.local.set({
        credentials: JSON.stringify(cObj),
      });
      await initCredList();
    },
    [initCredList, credentialsFromStore]
  );
  const handleUpdateCred = useCallback(
    (item: CredTypeItemType) => {
      setActiveCred(item);
      if (connectedWallet?.address) {
        setAddDialogVisible(true);
      } else {
        setConnectDialogVisible(true);
      }
    },
    [connectedWallet?.address]
  );

  const handleAdd = useCallback(async () => {
    if (
      (fromEvents === 'NFTs' || fromEvents === 'LINEA_DEFI_VOYAGE') &&
      activeCred
    ) {
      return;
    }
    setActiveCred(undefined);

    if (connectedWallet?.address) {
      setAddDialogVisible(true);
    } else {
      setConnectDialogVisible(true);
    }
  }, [connectedWallet?.address, fromEvents]);
  const handleJoinEvent = useCallback(async () => {
    if (connectedWallet?.address) {
      if (fromEvents === 'Scroll') {
        setClaimMysteryBoxVisible2(true);
      } else if (fromEvents === BASEVENTNAME) {
        setClaimEventBASVisible(true);
      }
    } else {
      setConnectDialogVisible(true);
    }
  }, [connectedWallet?.address, fromEvents]);
  const onCancelClaimMysteryBoxDialog2 = useCallback(() => {
    setClaimMysteryBoxVisible2(false);
    if (fromEvents === 'Scroll') {
      navigate('/events');
    }
  }, [fromEvents, navigate]);
  const onSubmitClaimMysteryBoxDialog2 = useCallback(async () => {
    // onSubmit
    const { credentials } = await chrome.storage.local.get('credentials');
    let credArrNew = Object.values(JSON.parse(credentials));

    const haveXProof = credArrNew.find(
      (i: any) => i.event === SCROLLEVENTNAME && i.source === 'x'
    );
    const haveBinanceProof = credArrNew.find(
      (i: any) => i?.event === SCROLLEVENTNAME && i.source === 'binance'
    );

    const proofsFlag = !!haveXProof && !!haveBinanceProof;
    // const proofsFlag = !!proofX && !!proofBinance;

    if (proofsFlag) {
      setClaimMysteryBoxVisible2(false);
      handleUpChain(haveXProof as CredTypeItemType);
    }
  }, [proofX, proofBinance, handleUpChain]);
  const onChangeClaimMysteryBoxDialog2 = (step: number) => {
    if (step === 2) {
      // x
      setEventSource('x');
    } else if (step === 3) {
      // binance
      setEventSource('binance');
    }
    // setClaimMysteryBoxVisible2(false);
    setAddDialogVisible(true);
  };

  const onCancelClaimEventBAS = useCallback(() => {
    setClaimEventBASVisible(false);
    if (fromEvents === BASEVENTNAME) {
      navigate('/events');
    }
  }, [fromEvents, navigate]);
  const onSubmitClaimEventBAS = useCallback(() => {
    setClaimEventBASVisible(false);
  }, []);
  const onChangeClaimEventBAS = useCallback(
    async (step: number) => {
      // step: 4
      if (step === 4) {
        // upper chain
        const { credentials } = await chrome.storage.local.get('credentials');
        let credArrNew = Object.values(JSON.parse(credentials));

        const res = await chrome.storage.local.get([BASEVENTNAME]);
        if (res[BASEVENTNAME]) {
          const lastInfo = JSON.parse(res[BASEVENTNAME]);
          const lastTasks = lastInfo.steps[1].tasks ?? {};
          const toBeUpperChainCredRequestids = Object.values(lastTasks);
          const toBeUpperChainCreds = credArrNew.filter((c: any) =>
            toBeUpperChainCredRequestids.includes(c.requestid)
          );
          const firstToBeUpperChainCred = toBeUpperChainCreds[0];
          if (firstToBeUpperChainCred) {
            setClaimEventBASVisible(false);
            handleUpChain(firstToBeUpperChainCred as CredTypeItemType);
          }
        }
      }
    },
    [handleUpChain]
  );
  const onClaimEventBASAttest = (attestId: string) => {
    setEventSource(attestId);
    setAddDialogVisible(true);
    if (attestId === GOOGLEWEBPROOFID) {
      setClaimEventBASVisible(false);
    }
  };

  const handleSubmitBindPolygonid = useCallback(async () => {
    await initCredList();
    setBindPolygonidVisible(false);
  }, [initCredList]);
  const handleCloseAddDialog = useCallback(
    (addSucFlag?: any) => {
      setActiveSourceName(undefined);
      if (fromEvents) {
        if (fromEvents === 'Scroll') {
          setAddDialogVisible(false);
          setClaimMysteryBoxVisible2(true);
        } else if (fromEvents === BASEVENTNAME) {
          // if (addSucFlag) {
          setAddDialogVisible(false);
          setClaimEventBASVisible(true);
          setClaimEventBASStep(2);
          // } else {
          //   navigate('/cred', { replace: true });
          // }
        } else {
          if (addSucFlag) {
            // addSucFlag: requestid;
            const activeC = credentialsFromStore[addSucFlag];
            setActiveCred(activeC);
            setAddDialogVisible(false);
            setSendToChainDialogVisible(true);
          } else if (addSucFlag === false) {
            if (fromEvents === 'NFTs') {
              const queryKey = `${fromEvents}Process`;
              const targetUrl = `/events?${queryKey}=error`;
              navigate(targetUrl);
            } else {
              navigate('/cred');
            }
          } else if (addSucFlag === undefined) {
            navigate('/cred');
          }
        }
      } else {
        setAddDialogVisible(false);
      }
    },
    [credentialsFromStore, fromEvents, navigate]
  );
  const handleCloseSendToChainDialog = useCallback(
    async (sucFlag?: any) => {
      setSendToChainDialogVisible(false);
      if (fromEvents) {
        let targetUrl = '/events';
        if (sucFlag) {
          if (fromEvents === 'Badges') {
            await chrome.storage.local.set({
              mysteryBoxRewards: '1',
            });
          } else if (fromEvents === 'NFTs') {
            targetUrl = '/events?NFTsProcess=suc';
            navigate(targetUrl);
          } else if (fromEvents === 'Scroll') {
            targetUrl = '/events?ScrollProcess=suc';
            navigate(targetUrl);
          } else if (fromEvents === 'LINEA_DEFI_VOYAGE') {
            navigate('/cred');
          } else if (fromEvents === BASEVENTNAME) {
            setSendToChainDialogVisible(false);
            setClaimEventBASVisible(true);
            navigate('/cred', { replace: true });
          }
        } else {
          if (fromEvents === 'Scroll') {
            targetUrl = '/events';
            navigate(targetUrl);
          } else if (fromEvents === BASEVENTNAME) {
            setSendToChainDialogVisible(false);
            setClaimEventBASVisible(true);
          } else {
            navigate('/cred');
          }
        }
        // else {
        //   const queryKey = `${fromEvents}Process`;
        //   targetUrl = `/events?${queryKey}=error`;
        // }
        // navigate(targetUrl);
      }
    },
    [fromEvents, navigate]
  );
  const handleBackToBASEvent = useCallback(() => {
    setClaimEventBASVisible(true);
    setSendToChainDialogVisible(false);
  }, []);
  const startFn = useCallback(() => {
    if (connectedWallet?.address) {
      setActiveRequest({
        type: 'loading',
        title: 'Processing',
        desc: 'Please complete the transaction in your wallet.',
      });
    } else {
      setActiveRequest({
        type: 'loading',
        title: 'Requesting Connection',
        desc: 'Check MetaMask to confirm the connection.',
      });
    }
    setConnectTipDialogVisible(true);
  }, [connectedWallet?.address]);
  const errorFn = useCallback(() => {
    setActiveRequest({
      type: 'warn',
      title: 'Unable to proceed',
      desc: errorDescEl,
    });
    setActiveCred(undefined);
  }, [errorDescEl]);
  const sucFn = useCallback(
    async (walletObj: any) => {
      if (fromEvents === 'Scroll') {
        setClaimMysteryBoxVisible2(true);
        setEventSource('');
        setConnectTipDialogVisible(false);
      } else {
        setAddDialogVisible(true);
        setConnectTipDialogVisible(false);
      }
    },
    [fromEvents]
  );
  const { connect } = useWallet();
  const handleSubmitConnectWallet = useCallback(
    async (wallet?: WALLETITEMTYPE) => {
      setConnectDialogVisible(false);
      setActiveRequest({
        type: 'loading',
        title: 'Requesting Connection',
        desc: 'Check MetaMask to confirm the connection.',
      });
      setConnectTipDialogVisible(true);
      connect(wallet?.name, startFn, errorFn, sucFn);
    },
    [connect, startFn, errorFn, sucFn]
  );
  const handleCloseConnectWallet = useCallback(() => {
    setConnectDialogVisible(false);
    if (fromEvents === 'Scroll') {
      navigate('/events');
    }
    if (fromEvents === 'LINEA_DEFI_VOYAGE' || fromEvents === 'NFTs') {
      navigate('/cred');
    }
  }, [fromEvents, navigate]);
  useEffect(() => {
    if (connectedWallet?.address) {
      setConnectDialogVisible(false);
    } else {
      setConnectDialogVisible(true);
      setClaimMysteryBoxVisible2(false);
      setClaimEventBASVisible(false);
      // bindPolygonidVisible;
      // qrcodeVisible;
      // sendToChainDialogVisible;
      setAddDialogVisible(false);
    }
  }, [connectedWallet?.address]);
  // const onSubmitConnectTipDialog = useCallback(() => {
  //   setConnectTipDialogVisible(false);
  //   dispatch(setConnectWalletDialogVisibleAction(true));
  // }, [dispatch]);
  useEffect(() => {
    initCredList();
  }, [initCredList]);
  useEffect(() => {
    dispatch({
      type: 'setActiveSourceType',
      payload: 'All',
    });
    return () => {
      dispatch({
        type: 'setActiveSourceType',
        payload: 'All',
      });
    };
  }, [dispatch]);
  useEffect(() => {
    if (createFlag || proofType) {
      setActiveSourceName(createFlag);
      setAddDialogVisible(true);
    } else {
      setActiveSourceName(undefined);
      if (!fromEvents) {
        setAddDialogVisible(false);
      }
    }
  }, [createFlag, proofType, fromEvents]);
  useEffect(() => {
    if (fromEvents) {
      if (fromEvents === 'Scroll' || fromEvents === BASEVENTNAME) {
        handleJoinEvent();
      } else {
        handleAdd();
      }
    }
  }, [fromEvents, handleAdd, handleJoinEvent]);
  useEffect(() => {
    const listerFn = (message: any) => {
      if (message.type === 'pageDecode') {
        if (message.name === 'sendRequest') {
          if (fromEvents === 'LINEA_DEFI_VOYAGE') {
            setClaimMysteryBoxVisible2(false);
          }
          if (fromEvents === BASEVENTNAME && eventSource !== GOOGLEWEBPROOFID) {
            if (eventSource !== GOOGLEWEBPROOFID) {
              setClaimEventBASVisible(false);
              setAddDialogVisible(true);
            }
          }
        } else if (
          message.name === 'cancelAttest' ||
          message.name === 'abortAttest'
        ) {
          if (fromEvents === BASEVENTNAME) {
            // setAddDialogVisible(false);
            setEventSource(undefined);
            // setClaimEventBASVisible(true);
            // setClaimEventBASStep(2);
          }
        }
      }
    };
    chrome.runtime.onMessage.addListener(listerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listerFn);
    };
  }, [fromEvents, eventSource]);

  useEffect(() => {
    return () => {
      const msg = {
        fullScreenType: 'algorithm',
        reqMethodName: 'stop',
        // params: {},
        params: {
          noRestart: true,
        },
      };
      console.log('before leave page credit port:', padoServicePort);
      postMsg(padoServicePort, msg);
    };
  }, [padoServicePort]);

  return (
    <div className="credOverview">
      <CredList
        list={filteredCredList}
        onUpChain={handleUpChain}
        onViewQrcode={handleViewQrcode}
        onBindPolygonID={handleBindPolygonID}
        onDelete={handleDeleteCred}
        onUpdate={handleUpdateCred}
        onAdd={handleAdd}
      />
      {!sendToChainDialogVisible && connectDialogVisible && (
        <ConnectWalletDialog
          onClose={handleCloseConnectWallet}
          onSubmit={handleSubmitConnectWallet}
        />
      )}
      {connectTipDialogVisible && (
        <AddSourceSucDialog
          type={activeRequest?.type}
          title={activeRequest?.title}
          desc={activeRequest?.desc}
          activeSource={DATASOURCEMAP['onChain']}
          onClose={handleCloseConnectTipDialog}
          onSubmit={() => {}}
          footerButton={footerButton}
        />
      )}
      <CredAddWrapper
        visible={addDialogVisible}
        activeCred={activeCred}
        activeSource={activeSourceName}
        onClose={handleCloseAddDialog}
        onSubmit={handleCloseAddDialog}
        type={proofType}
        eventSource={eventSource}
      />
      <CredSendToChainWrapper
        visible={sendToChainDialogVisible}
        activeCred={activeCred}
        onClose={handleCloseSendToChainDialog}
        onSubmit={handleCloseSendToChainDialog}
        handleBackToBASEvent={handleBackToBASEvent}
      />
      {qrcodeVisible && (
        <QRCodeDialog
          activeCred={activeCred}
          onClose={handleCloseQrcode}
          onSubmit={() => {
            setQrcodeVisible(false);
          }}
        />
      )}
      <BindPolygonID
        visible={bindPolygonidVisible}
        activeCred={activeCred}
        onClose={handleCloseBindPolygonid}
        onSubmit={handleSubmitBindPolygonid}
      />
      <ClaimMysteryBoxWrapper2
        visible={claimMysteryBoxVisible2}
        onClose={onCancelClaimMysteryBoxDialog2}
        onSubmit={onSubmitClaimMysteryBoxDialog2}
        onChange={onChangeClaimMysteryBoxDialog2}
      />
      <ClaimEventBAS
        visible={claimEventBASVisible}
        onClose={onCancelClaimEventBAS}
        onSubmit={onSubmitClaimEventBAS}
        onChange={onChangeClaimEventBAS}
        onAttest={onClaimEventBASAttest}
        activeStep={claimEventBASStep}
      />
      {credList.length > 0 && <DataAddBar onClick={handleAdd} />}
    </div>
  );
});

export default CredOverview;
