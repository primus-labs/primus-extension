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
import type { WALLETITEMTYPE } from '@/utils/constants';

import type { ActiveRequestType } from '@/pages/DataSourceOverview';
import type { AttestionForm } from '@/components/Cred/AttestationDialog';
import { ONCHAINLIST, PADOADDRESS } from '@/utils/constants';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconTool1 from '@/assets/img/iconTool1.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconOptimism from '@/assets/img/iconOptimism.svg';
import iconMina from '@/assets/img/iconMina.png';
import { connectWallet } from '@/services/wallets/metamask';
import { attestByDelegation } from '@/services/chains/eas.js';
import request from '../../utils/request';

type CREDENTIALSOBJ = {
  [propName: string]: CredTypeItemType;
};
const Cred = () => {
  const dispatch: Dispatch<any> = useDispatch();
  const [credentialsObj, setCredentialsObj] = useState<CREDENTIALSOBJ>({});
  const credList:CredTypeItemType[] = useMemo(() => {
    return Object.values(credentialsObj);
  }, [credentialsObj]);
  const [step, setStep] = useState(0);
  const [activeNetworkName, setActiveNetworkName] = useState<string>();
  const [fetchAttestationTimer, setFetchAttestationTimer] = useState<any>();
  const [qrcodeVisible, setQrcodeVisible] = useState<boolean>(false);
  const [activeAttestationType, setActiveAttestationType] =
    useState<string>('');
  const [activeCred, setActiveCred] = useState<CredTypeItemType>();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const navigate = useNavigate();
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const handleChangeTab = (val: string) => {
  };
  const initCredList = useCallback(async () => {
    const cObj = await getCredentialsObjFromStorage();
    setCredentialsObj(cObj);
  }, []);
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
    console.log(`page_send:getAttestation:` , form);
    setStep(2);
    setActiveRequest({
      type: 'loading',
      title: 'Attestation is processing',
      desc: 'It may take a few minutes.',
    });
  };
  const onSubmitActiveRequestDialog = () => {
    if (activeRequest?.type === 'suc') {
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
    debugger
    setActiveNetworkName(networkName);
    setStep(4);
  };
  const handleCancelTransferToChain = () => {};
  const handleBackConnectWallet = () => {
    setStep(3);
  };
  const handleSubmitConnectWallet = async (wallet: WALLETITEMTYPE) => {
    // TODO
    setActiveRequest({
      type: 'loading',
      title: 'Processing',
      desc: 'Please complete the transaction in your wallet.',
    });
    const [accounts, chainId, provider] = await connectWallet();
    // if (provider && provider.on) {
    //   const handleConnect = () => {
    //     console.log('metamask connected 2');
    //   };
    //   provider.on('connect', handleConnect);
    // }
    const { keyStore } = await chrome.storage.local.get(['keyStore']);
    const { address } = JSON.parse(keyStore);
    const upChainParams = {
      networkName: activeNetworkName,
      metamaskprovider: provider,
      receipt: '0x' + address,
      attesteraddr: PADOADDRESS,
      data: activeCred?.encodedData,
      signature: activeCred?.signature,
    };
    const upChainRes = await attestByDelegation(upChainParams);
    // TODO
    const cObj = await getCredentialsObjFromStorage()
    const curRequestid = activeCred?.requestid as string
    const curCredential = credentialsObj[curRequestid];
    const newProvided = curCredential.provided ?? [];
    const currentChainObj = ONCHAINLIST.find(
      (i) => activeNetworkName === i.title
    );
    const existIndex = newProvided.findIndex(i => i.title === activeNetworkName)
    existIndex < 0 && newProvided.push(currentChainObj);
    
    cObj[curRequestid] = Object.assign(curCredential, {
      provided: newProvided,
    }); 
    await chrome.storage.local.set({
      credentials: JSON.stringify(cObj),
    });
    initCredList();
    setActiveRequest({
      type: 'suc',
      title: 'Congratulations',
      desc: 'Your attestation is recorded on-chain!',
    });

    setStep(5);
  };
  const handleViewQrcode = useCallback(() => {
    setQrcodeVisible(true);
  },[]);
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
  const initAlgorithm = () => {
    postMsg(padoServicePort, {});
    const msg: any = {
      fullScreenType: 'algorithm',
      reqMethodName: 'start',
      params: {},
    };
    postMsg(padoServicePort, msg);
    console.log(`page_send:start request`);
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
          // if (res) {
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
          }, 2000);
          setFetchAttestationTimer(fetchTimer);
          // }
        }
        if (resMethodName === `getAttestationResult`) {
          if (res) {
            const { activeRequestAttestation } = await chrome.storage.local.get(
              ['activeRequestAttestation']
            );
            const parsedActiveRequestAttestation =
              activeRequestAttestation ? JSON.parse(activeRequestAttestation) : {};
            console.log('attestation', parsedActiveRequestAttestation);
            const activeRequestId = parsedActiveRequestAttestation.requestid;

            const fullAttestation = {
              ...res,
              ...parsedActiveRequestAttestation,
              // balanceGreaterBaseValue: 'true', // or bool statusNormal // TODO
              // signature:
              //   '0xe20047bae74674c117d36af76ea5745c4711824c713cac065996ddad8eef6f9a', // includes v，r，s // TODO
              // data: '0x123', // trueHash or falseHash // TODO
            };
            const { credentials: credentialsStr } = await chrome.storage.local.get([
              'credentials',
            ]);
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
            // TODO attest suc
            // clearInterval(timer);
            // clearInterval(fetchAttestationTimer);
          }
        }
      }
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);
  };
  useEffect(() => {
    initAlgorithm();
  }, []);
  useEffect(() => {
    return () => {
      fetchAttestationTimer && clearInterval(fetchAttestationTimer);
    };
  }, [fetchAttestationTimer]);
  useEffect(() => {
    if (fetchAttestationTimer && activeRequest?.type === 'suc') {
      clearInterval(fetchAttestationTimer);
    }
  }, [fetchAttestationTimer, activeRequest]);
  const getCredentialsObjFromStorage = async (): Promise<CREDENTIALSOBJ> => {
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    return credentialObj;
  };
  
  useEffect(() => {
    // chrome.storage.local.remove(['credentials']); //TODO DELETE
    initCredList();
  }, []);

  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} value="Cred" />
        <DataSourceSearch />
        <ProofTypeList onChange={handleChangeProofType} />
        <CredList
          list={credList}
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
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerType="attestation"
          />
        )}
        {qrcodeVisible && (
          <QRCodeDialog
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
