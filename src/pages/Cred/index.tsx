import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import PTabs from '@/components/PTabs';
import './index.sass';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import ProofTypeList from '@/components/Cred/ProofTypeList';
import AttestationDialog from '@/components/Cred/AttestationDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog';
import ConnectWalletDialog from '@/components/Cred/ConnectWalletDialog';
import CredList from '@/components/Cred/CredList';
import QRCodeDialog from '@/components/Cred/QRCodeDialog';
import type { CredTypeItemType } from '@/components/Cred/CredItem';
import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type { WALLETITEMTYPE } from '@/config/constants';
import { ATTESTATIONTIMEOUT, ATTESTATIONPOLLINGTIME } from '@/config/constants';

import type { ActiveRequestType } from '@/pages/DataSourceOverview';
import type { AttestionForm } from '@/components/Cred/AttestationDialog';

import { ONCHAINLIST, PADOADDRESS, EASInfo } from '@/config/envConstants';
import { connectWallet } from '@/services/wallets/metamask';
import { attestByDelegation } from '@/services/chains/eas.js';
import {setCredentialsAsync} from '@/store/actions'
export type CREDENTIALSOBJ = {
  [propName: string]: CredTypeItemType;
};
const Cred = () => {
  const dispatch: Dispatch<any> = useDispatch();
  const [credentialsObj, setCredentialsObj] = useState<CREDENTIALSOBJ>({});
  
  const [step, setStep] = useState(0);
  const [activeNetworkName, setActiveNetworkName] = useState<string>();
  const [fetchAttestationTimer, setFetchAttestationTimer] = useState<any>();
  const [fetchTimeoutTimer, setFetchTimeoutTimer] = useState<any>();
  const [qrcodeVisible, setQrcodeVisible] = useState<boolean>(false);
  const [activeAttestationType, setActiveAttestationType] =
    useState<string>('');
  const [activeCred, setActiveCred] = useState<CredTypeItemType>();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const navigate = useNavigate();
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const [activeSendToChainRequest, setActiveSendToChainRequest] =
    useState<ActiveRequestType>();
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector((state: UserState) => state.filterWord);
  const credList: CredTypeItemType[] = useMemo(() => {
    return Object.values(credentialsObj);
  }, [credentialsObj]);
  const filteredCredList: CredTypeItemType[] = useMemo(() => {
    let activeList = credList;
    if (activeSourceType && activeSourceType!== 'All') {
      activeList = activeList.filter((i) => i.type === activeSourceType);
    }
    if (filterWord) {
      activeList = activeList.filter((i) =>
        i.source.toLowerCase().startsWith(filterWord)
      );
    }
    return activeList
  }, [credList, activeSourceType, filterWord]);
  const handleChangeTab = (val: string) => {};
  const initCredList = useCallback(async () => {
    const cObj = await getCredentialsObjFromStorage();
    dispatch(setCredentialsAsync());
    setCredentialsObj(cObj);
  }, [dispatch]);
  const handleChangeProofType = (title: string) => {
    setStep(1);
    setActiveAttestationType(title);
  };
  const handleCloseMask = () => {
    setStep(0);
  };

  const onSubmitAttestationDialog = async (
    form: AttestionForm,
    activeCred?: CredTypeItemType
  ) => {
    // if activeCred is update,not add
    const msg = {
      fullScreenType: 'algorithm',
      reqMethodName: 'getAttestation',
      params: {
        ...form,
      },
    };
    postMsg(padoServicePort, msg);
    console.log(`page_send:getAttestation:`, form);
    setStep(2);
    setActiveRequest({
      type: 'loading',
      title: 'Attestation is processing',
      desc: 'It may take a few minutes.',
    });
  };
  const onSubmitActiveRequestDialog = () => {
    if (
      activeRequest?.type === 'suc' ||
      activeRequest?.type === 'error' ||
      activeRequest?.type === 'warn'
    ) {
      setStep(0);
      // refresh attestation list
      return;
    }
  };
  const onSubmitActiveSendToChainRequestDialog = () => {
    if (
      activeSendToChainRequest?.type === 'suc' ||
      activeSendToChainRequest?.type === 'error' ||
      activeSendToChainRequest?.type === 'warn'
    ) {
      setStep(0);
      // refresh attestation list
      return;
    }
  };
  const handleUpChain = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setStep(3);
  }, []);
  const handleSubmitTransferToChain = (networkName: string) => {
    // TODO
    setActiveNetworkName(networkName);
    setStep(4);
  };
  const handleCancelTransferToChain = () => {};
  const handleBackConnectWallet = () => {
    setStep(3);
  };
  const handleSubmitConnectWallet = async (wallet: WALLETITEMTYPE) => {
    // TODO
    setStep(5);
    setActiveSendToChainRequest({
      type: 'loading',
      title: 'Processing',
      desc: 'Please complete the transaction in your wallet.',
    });

    const targetNetwork = EASInfo[activeNetworkName as keyof typeof EASInfo];
    try {
      const [accounts, chainId, provider] = await connectWallet(targetNetwork);
      const { keyStore } = await chrome.storage.local.get(['keyStore']);
      const { address } = JSON.parse(keyStore);
      const upChainParams = {
        networkName: activeNetworkName,
        metamaskprovider: provider,
        receipt: '0x' + address,
        attesteraddr: PADOADDRESS, // TODO
        data: activeCred?.encodedData,
        signature: activeCred?.signature,
      };
      const upChainRes = await attestByDelegation(upChainParams);
      if (upChainRes) {
        const cObj = await getCredentialsObjFromStorage();
        const curRequestid = activeCred?.requestid as string;
        const curCredential = credentialsObj[curRequestid];
        const newProvided = curCredential.provided ?? [];
        const currentChainObj: any = ONCHAINLIST.find(
          (i) => activeNetworkName === i.title
        );
        currentChainObj.attestationUID = upChainRes;
        const existIndex = newProvided.findIndex(
          (i) => i.title === activeNetworkName
        );
        existIndex < 0 && newProvided.push(currentChainObj);

        cObj[curRequestid] = Object.assign(curCredential, {
          provided: newProvided,
        });
        await chrome.storage.local.set({
          credentials: JSON.stringify(cObj),
        });
        initCredList();
        setActiveSendToChainRequest({
          type: 'suc',
          title: 'Congratulations',
          desc: 'Your attestation is recorded on-chain!',
        });
      } else {
        setActiveSendToChainRequest({
          type: 'error',
          title: 'Failed',
          desc: 'Your request did not meet the necessary requirements. Please confirm and try again later.',
        });
      }
    } catch (e) {
      setActiveSendToChainRequest({
        type: 'error',
        title: 'Failed',
        desc: 'Your request did not meet the necessary requirements. Please confirm and try again later.',
      });
    }
  };
  const handleViewQrcode = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setQrcodeVisible(true);
  }, []);
  const handleCloseQrcode = () => {
    setQrcodeVisible(false);
    handleCloseMask();
  };
  const handleDeleteCred = useCallback(
    async (item: CredTypeItemType) => {
      const curRequestid = item.requestid;
      const cObj = await getCredentialsObjFromStorage();
      delete cObj[curRequestid];
      chrome.storage.local.set({
        credentials: JSON.stringify(cObj),
      });
      await initCredList();
    },
    [initCredList]
  );
  const handleUpdateCred = useCallback((item: CredTypeItemType) => {
    setActiveAttestationType(item.type);
    setActiveCred(item);
    setStep(1);
  }, []);
  const padoServicePortListener = async function (message: any) {
    const { resType, resMethodName, res } = message;
    if (resType === 'algorithm') {
      console.log(`page_get:${resMethodName}:`, res);
      if (resMethodName === `start`) {
        console.log(`page_get:start:`, message.res);
        const msg = {
          fullScreenType: 'algorithm',
          reqMethodName: 'init',
          params: {},
        };
        postMsg(padoServicePort, msg);
        console.log(`page_send:init request`);
      }
      if (resMethodName === `init`) {
        if (res) {
          // algorithm is ready
        }
      }
      if (resMethodName === `getAttestation`) {
        if (res) {
          // TODO wheather wait getAttestation msg back
          const fetchAttestationResult = () => {
            const msg = {
              fullScreenType: 'algorithm',
              reqMethodName: 'getAttestationResult',
              params: {},
            };
            postMsg(padoServicePort, msg);
            console.log('page_send:getAttestationResult request');
          };
          const fetchTimer = setInterval(() => {
            fetchAttestationResult();
          }, ATTESTATIONPOLLINGTIME);
          setFetchAttestationTimer(fetchTimer);
          const fTimeoutTimer = setTimeout(() => {
            console.log('60s timeout', fetchTimer);
            // close offscreen.html
            if (activeRequest?.type === 'suc') {
              return;
            }
            const msg = {
              fullScreenType: 'algorithm',
              reqMethodName: 'stop',
              params: {},
            };
            postMsg(padoServicePort, msg);
            fetchTimer && clearInterval(fetchTimer);
            setActiveRequest({
              type: 'warn',
              title: 'Something went wrong',
              desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
            });
          }, ATTESTATIONTIMEOUT);
          setFetchTimeoutTimer(fTimeoutTimer);
        }
      }
      if (resMethodName === `getAttestationResult`) {
        if (res) {
          const { retcode, content } = JSON.parse(res);
          if (retcode === '0') {
            clearFetchAttestationTimer();
            // TODO balanceGreaterThanBaseValue
            if (content.balanceGreaterThanBaseValue === 'true') {
              const { activeRequestAttestation } =
                await chrome.storage.local.get(['activeRequestAttestation']);
              const parsedActiveRequestAttestation = activeRequestAttestation
                ? JSON.parse(activeRequestAttestation)
                : {};
              console.log('attestation', parsedActiveRequestAttestation);
              const activeRequestId = parsedActiveRequestAttestation.requestid;

              const fullAttestation = {
                ...content,
                ...parsedActiveRequestAttestation,
              };
              const { credentials: credentialsStr } =
                await chrome.storage.local.get(['credentials']);
              const credentialsObj = credentialsStr
                ? JSON.parse(credentialsStr)
                : {};
              credentialsObj[activeRequestId] = fullAttestation;
              await chrome.storage.local.set({
                credentials: JSON.stringify(credentialsObj),
              });
              await chrome.storage.local.remove(['activeRequestAttestation']);

              initCredList();
              setActiveRequest({
                type: 'suc',
                title: 'Congratulations',
                desc: 'Your proof is created!',
              });
            } else if (content.balanceGreaterThanBaseValue === 'false') {
              setActiveRequest({
                type: 'error',
                title: 'Failed',
                desc: 'Your request did not meet the necessary requirements. Please confirm and try again later.',
              });
            }
          } else if (retcode === '2') {
            // TODO
            setActiveRequest({
              type: 'warn',
              title: 'Something went wrong',
              desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
            });
          }
        }
      }
      if (resMethodName === `stop`) {
        if (res.retcode === 0) {
          const msg: any = {
            fullScreenType: 'algorithm',
            reqMethodName: 'start',
            params: {},
          };
          postMsg(padoServicePort, msg);
          console.log(`page_send:start request`);
        }
      }
    }
  };
  const initAlgorithm = () => {
    const msg: any = {
      fullScreenType: 'algorithm',
      reqMethodName: 'start',
      params: {},
    };
    postMsg(padoServicePort, msg);
    console.log(`page_send:start request`);
    padoServicePort.onMessage.addListener(padoServicePortListener);
  };

  const clearFetchTimeoutTimer = useCallback(() => {
    fetchTimeoutTimer && clearTimeout(fetchTimeoutTimer);
  }, [fetchTimeoutTimer]);
  const clearFetchAttestationTimer = useCallback(() => {
    if (fetchAttestationTimer) {
      clearInterval(fetchAttestationTimer);
      clearFetchTimeoutTimer();
    }
  }, [fetchAttestationTimer, clearFetchTimeoutTimer]);
  const getCredentialsObjFromStorage = async (): Promise<CREDENTIALSOBJ> => {
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    return credentialObj;
  };
  useEffect(() => {
    initAlgorithm();
    return () => {
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    };
  }, []);
  useEffect(() => {
    return () => {
      clearFetchAttestationTimer();
    };
  }, [clearFetchAttestationTimer]);
  useEffect(() => {
    return () => {
      clearFetchTimeoutTimer();
    };
  }, [clearFetchTimeoutTimer]);

  useEffect(() => {
    if (
      activeRequest?.type === 'suc' ||
      activeRequest?.type === 'error' ||
      activeRequest?.type === 'warn'
    ) {
      clearFetchAttestationTimer();
    }
  }, [clearFetchAttestationTimer, activeRequest]);

  useEffect(() => {
    // chrome.storage.local.remove(['credentials']); //TODO DELETE
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
    }
  }, [])

  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} value="Cred" />
        <DataSourceSearch />
        <ProofTypeList onChange={handleChangeProofType} />
        <CredList
          list={filteredCredList}
          onUpChain={handleUpChain}
          onViewQrcode={handleViewQrcode}
          onDelete={handleDeleteCred}
          onUpdate={handleUpdateCred}
        />
        {step === 1 && (
          <AttestationDialog
            type={activeAttestationType}
            onClose={handleCloseMask}
            onSubmit={onSubmitAttestationDialog}
            activeCred={activeCred}
          />
        )}
        {step === 2 && (
          <AddSourceSucDialog
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerType="attestation"
          />
        )}
        {step === 3 && (
          <TransferToChainDialog
            onClose={handleCloseMask}
            onSubmit={handleSubmitTransferToChain}
            onCancel={handleCancelTransferToChain}
            title="Provide Attestation"
            desc="Send your proof to one of the following chain. Provide an on-chain attestation for dApps."
            list={ONCHAINLIST}
            tip="Please select one chain to provide attestation"
            checked={false}
            backable={false}
            headerType="attestation"
          />
        )}
        {step === 4 && (
          <ConnectWalletDialog
            onClose={handleCloseMask}
            onSubmit={handleSubmitConnectWallet}
            onBack={handleBackConnectWallet}
          />
        )}
        {step === 5 && (
          <AddSourceSucDialog
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveSendToChainRequestDialog}
            type={activeSendToChainRequest?.type}
            title={activeSendToChainRequest?.title}
            desc={activeSendToChainRequest?.desc}
            headerType="attestation"
          />
        )}
        {qrcodeVisible && (
          <QRCodeDialog
            activeCred={activeCred}
            onClose={handleCloseQrcode}
            onSubmit={() => {
              setQrcodeVisible(false);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Cred;
