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
import type { ActiveRequestType } from '@/pages/DataSourceOverview';
import { ONCHAINLIST } from '@/utils/constants';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconTool1 from '@/assets/img/iconTool1.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconOptimism from '@/assets/img/iconOptimism.svg';
import iconMina from '@/assets/img/iconMina.png';

const Cred = () => {
  const dispatch: Dispatch<any> = useDispatch();
  const [credList, setCredList] = useState([
    {
      type: 'Assets Proof',
      icon: iconDataSourceBinance,
      name: 'Binance',
      id: '111',
      label: '111',
      date: 'May 02, 2023',
      provided: [],
    },
    {
      type: 'Assets Proof',
      icon: iconDataSourceBinance,
      name: 'Binance',
      id: '222',
      label: '111',
      date: 'May 02, 2023',
      provided: [iconTool1],
    },
    {
      type: 'Assets Proof',
      icon: iconDataSourceBinance,
      name: 'OKX',
      id: '333',
      label: '111',
      date: 'May 02, 2023',
      provided: [iconTool1, iconArbitrum, iconOptimism],
    },
    {
      type: 'Token Holdings',
      icon: iconDataSourceBinance,
      name: 'Coinbase',
      id: '444',
      label: '111',
      date: 'May 02, 2023',
      provided: [iconTool1, iconArbitrum, iconOptimism],
      holdingToken: 'BNB',
    },
  ]);
  const [step, setStep] = useState(0);
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
    if (val === 'Data') {
      dispatch({
        type: 'setActiveSourceType',
        payload: 'All',
      });
    }
  };
  const handleChangeProofType = (title: string) => {
    setStep(1);
    setActiveAttestationType(title);
  };
  const handleCloseMask = () => {
    setStep(0);
  };

  const onSubmitAttestationDialog = async (
    item: DataFieldItem,
    token: string,
    activeCred?: CredTypeItemType
  ) => {
    // if activeCred is update,not add
    const msg = {
      fullScreenType: 'algorithm',
      reqMethodName: 'getAttestation',
      params: {},
    };
    postMsg(padoServicePort, msg);
    console.log(`page_send:getAttestation:`);

    setStep(2);
    setActiveRequest({
      type: 'loading',
      title: 'Attestation is processing',
      desc: 'It may take a few minutes.',
    });
    // setTimeout(() => {
    //   setActiveRequest({
    //     type: 'suc',
    //     title: 'Congratulations',
    //     desc: 'Your proof is created!',
    //   });
    // }, 2000);
  };
  const onSubmitActiveRequestDialog = () => {
    if (activeRequest?.type === 'suc') {
      setStep(0);
      // refresh attestation list
      return;
    }
  };
  const handleUpChain = (item: CredTypeItemType) => {
    setStep(3);
  };
  const handleSubmitTransferToChain = () => {
    setStep(4);
  };
  const handleCancelTransferToChain = () => {};
  const handleBackConnectWallet = () => {
    setStep(3);
  };
  const handleSubmitConnectWallet = () => {
    setActiveRequest({
      type: 'loading',
      title: 'Processing',
      desc: 'Please complete the transaction in your wallet.',
    });
    setTimeout(() => {
      setActiveRequest({
        type: 'suc',
        title: 'Congratulations',
        desc: 'Your attestation is recorded on-chain!',
      });
    }, 2000);
    setStep(5);
  };
  const handleViewQrcode = () => {
    setQrcodeVisible(true);
  };
  const handleCloseQrcode = () => {
    setQrcodeVisible(false);
    handleCloseMask();
  };
  const handleDeleteCred = (item: CredTypeItemType) => {
    let newList = [...credList];
    newList = newList.filter((i) => i.id !== item.id);
    setCredList(newList);
  };
  const handleUpdateCred = (item: CredTypeItemType) => {
    setActiveAttestationType(item.type);
    setActiveCred(item);
    setStep(1);
  };
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
          // debugger;
          setFetchAttestationTimer(fetchTimer);
          // }
        }
        if (resMethodName === `getAttestationResult`) {
          if (res) {
            const storageRes = await chrome.storage.local.get(['credentials']);
            const credentialsStr = storageRes.credentials;
            const credentialArr = credentialsStr?JSON.parse(credentialsStr): [];
            credentialArr.push(res)
            // debugger
            chrome.storage.local.set({
              credentials: JSON.stringify(credentialArr),
            });
            setCredList(credentialArr);
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
      // debugger
      clearInterval(fetchAttestationTimer);
    }
  }, [fetchAttestationTimer, activeRequest]);
  const initCredList = async() => {
    const storageRes = await chrome.storage.local.get(['credentials']);
    const credentialsStr = storageRes.credentials;
    const credentialArr = credentialsStr ? JSON.parse(credentialsStr) : [];
    setCredList(credentialArr);
  }
  useEffect(() => {
    chrome.storage.local.remove(['credentials']);//TODO
    initCredList()
  }, [])

  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
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
