import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DATASOURCEMAP } from '@/config/constants';

import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import CredList from '@/components/Cred/CredList';
import QRCodeDialog from '@/components/Cred/QRCodeDialog';
import DataAddBar from '@/components/DataSourceOverview/DataAddBar';
import BindPolygonID from '@/components/Cred/BindPolygonID';
import CredSendToChainWrapper from '../CredSendToChainWrapper';
import {
  setCredentialsAsync,
  setConnectWalletDialogVisibleAction,
  connectWalletAsync,
  setRewardsDialogVisibleAction,
} from '@/store/actions';

import { postMsg } from '@/utils/utils';
import type { Dispatch } from 'react';
import type { CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { ActiveRequestType } from '@/types/config';
import type { WALLETITEMTYPE } from '@/types/config';
import CredAddWrapper from '../CredAddWrapper';
import './index.sass';
import ConnectWalletDialog from '../CredSendToChainWrapper/ConnectWalletDialog';

const CredOverview = memo(() => {
  const navigate = useNavigate();
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
    let credArr = Object.values(credentialsFromStore);
    credArr = credArr.sort(
      (a, b) => Number(a.getDataTime) - Number(b.getDataTime)
    );
    return credArr;
  }, [credentialsFromStore]);
  const filteredCredList: CredTypeItemType[] = useMemo(() => {
    let activeList = credList;
    if (activeSourceType && activeSourceType !== 'All') {
      activeList = activeList.filter((i) => {
        const curProofTypeItem = proofTypes.find(
          (j) => j.credIdentifier === i.type
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
      delete cObj[curRequestid];
      chrome.storage.local.set({
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
    setActiveCred(undefined);
    if (connectedWallet?.address) {
      setAddDialogVisible(true);
    } else {
      setConnectDialogVisible(true);
    }
  }, [connectedWallet?.address]);

  const handleSubmitBindPolygonid = useCallback(async () => {
    await initCredList();
    setBindPolygonidVisible(false);
  }, [initCredList]);

  const handleCloseAddDialog = useCallback(
    (addSucFlag?: any) => {
      setActiveSourceName(undefined);
      !fromEvents && setAddDialogVisible(false);
      if (fromEvents) {
        if (addSucFlag) {
          // addSucFlag: requestid;
          const activeC = credentialsFromStore[addSucFlag];
          setActiveCred(activeC);
          setAddDialogVisible(false);
          setSendToChainDialogVisible(true);
        } else if (addSucFlag === false) {
          const queryKey = `${fromEvents}Process`;
          const targetUrl = `/events?${queryKey}=error`;
          navigate(targetUrl);
        }
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
            dispatch(
              setRewardsDialogVisibleAction({
                visible: true,
                tab: fromEvents,
              })
            );
          } else if (fromEvents === 'NFTs') {
            targetUrl = '/events?NFTsProcess=suc';
          }
          navigate(targetUrl);
        }
        // else {
        //   const queryKey = `${fromEvents}Process`;
        //   targetUrl = `/events?${queryKey}=error`;
        // }
        // navigate(targetUrl);
      }
    },
    [fromEvents, navigate, dispatch]
  );
  const handleSubmitConnectWallet = useCallback(
    async (wallet?: WALLETITEMTYPE) => {
      const startFn = () => {
        setActiveRequest({
          type: 'loading',
          title: 'Processing',
          desc: 'Please complete the transaction in your wallet.',
        });
        setConnectTipDialogVisible(true);
      };
      const errorFn = () => {
        setActiveRequest({
          type: 'error',
          title: 'Failed',
          desc: errorDescEl,
        });
        setActiveCred(undefined);
      };
      const sucFn = async (walletObj: any) => {
        setAddDialogVisible(true);
        setConnectTipDialogVisible(false);
      };
      dispatch(connectWalletAsync(undefined, startFn, errorFn, sucFn));
    },
    [errorDescEl, dispatch]
  );
  // const onSubmitConnectTipDialog = useCallback(() => {
  //   setConnectTipDialogVisible(false);
  //   dispatch(setConnectWalletDialogVisibleAction(true));
  // }, [dispatch]);
  useEffect(() => {
    initCredList();
  }, []);
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
      handleAdd();
    }
  }, [fromEvents, handleAdd]);

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
      {connectDialogVisible && (
        <ConnectWalletDialog
          onClose={() => {
            setConnectDialogVisible(false);
          }}
          onSubmit={handleSubmitConnectWallet}
          desc="Your have to connect a wallet before generate an attestation."
        />
      )}
      {connectTipDialogVisible && (
        <AddSourceSucDialog
          type={activeRequest?.type}
          title={activeRequest?.title}
          desc={activeRequest?.desc}
          activeSource={DATASOURCEMAP['onChain']}
          onClose={() => {
            setConnectTipDialogVisible(false);
          }}
          onSubmit={() => {}}
        />
      )}
      <CredAddWrapper
        visible={addDialogVisible}
        activeCred={activeCred}
        activeSource={activeSourceName}
        onClose={handleCloseAddDialog}
        onSubmit={handleCloseAddDialog}
        type={proofType}
      />
      <CredSendToChainWrapper
        visible={sendToChainDialogVisible}
        activeCred={activeCred}
        onClose={handleCloseSendToChainDialog}
        onSubmit={handleCloseSendToChainDialog}
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
      {credList.length > 0 && <DataAddBar onClick={handleAdd} />}
    </div>
  );
});

export default CredOverview;
