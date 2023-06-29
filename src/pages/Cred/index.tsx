import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import PTabs from '@/components/PTabs';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import AttestationDialog from '@/components/Cred/AttestationDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog';
import ConnectWalletDialog from '@/components/Cred/ConnectWalletDialog';
import CredList from '@/components/Cred/CredList';
import QRCodeDialog from '@/components/Cred/QRCodeDialog';
import DataAddBar from '@/components/DataSourceOverview/DataAddBar';
import CredTypesDialog from '@/components/Cred/CredTypesDialog';
import BindPolygonID from '@/components/Cred/BindPolygonID';

import { postMsg } from '@/utils/utils';
import useTimeout from '@/hooks/useTimeout';
import useInterval from '@/hooks/useInterval';
import useAlgorithm from '@/hooks/useAlgorithm';
import {
  ATTESTATIONPOLLINGTIMEOUT,
  ATTESTATIONPOLLINGTIME,
  BIGZERO,
} from '@/config/constants';
import { ONCHAINLIST, PADOADDRESS, EASInfo } from '@/config/envConstants';
import { connectWallet } from '@/services/wallets/metamask';
import { attestByDelegationProxy } from '@/services/chains/eas.js';
import { setCredentialsAsync } from '@/store/actions';
import { add, mul, gt } from '@/utils/utils';

import type { Dispatch } from 'react';
import type { CredTypeItemType, AttestionForm } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/types/config';
import type { AssetsMap } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';

import './index.sass';

export type CREDENTIALSOBJ = {
  [propName: string]: CredTypeItemType;
};

const Cred = memo(() => {
  const [bindPolygonidVisible, setBindPolygonidVisible] =
    useState<boolean>(false);
  const [submitAddress, setSubmitAddress] = useState<string>();
  const [credTypesDialogVisible, setCredTypesDialogVisible] =
    useState<boolean>();
  const [credentialsObj, setCredentialsObj] = useState<CREDENTIALSOBJ>({});
  const [step, setStep] = useState(0);
  const [activeNetworkName, setActiveNetworkName] = useState<string>();
  const [qrcodeVisible, setQrcodeVisible] = useState<boolean>(false);
  const [activeAttestationType, setActiveAttestationType] =
    useState<string>('');
  const [activeCred, setActiveCred] = useState<CredTypeItemType>();
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const [activeSendToChainRequest, setActiveSendToChainRequest] =
    useState<ActiveRequestType>();
  const [timeoutSwitch, setTimeoutSwitch] = useState<boolean>(false);
  const [intervalSwitch, setIntervalSwitch] = useState<boolean>(false);

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const exSources = useSelector((state: UserState) => state.exSources);
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector((state: UserState) => state.filterWord);
  const proofTypes = useSelector((state: UserState) => state.proofTypes);
  const userInfo = useSelector((state: UserState) => state.userInfo);

  const timeoutFn = useCallback(() => {
    console.log('120s timeout');
    if (activeRequest?.type === 'suc') {
      return;
    }
    setActiveRequest({
      type: 'warn',
      title: 'Something went wrong',
      desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
    });
    const msg = {
      fullScreenType: 'algorithm',
      reqMethodName: 'stop',
      params: {},
    };
    console.log('after timeout port', padoServicePort);
    postMsg(padoServicePort, msg);
  }, [padoServicePort, activeRequest?.type]);
  const intervalFn = useCallback(() => {
    const msg = {
      fullScreenType: 'algorithm',
      reqMethodName: 'getAttestationResult',
      params: {},
    };
    postMsg(padoServicePort, msg);
    console.log('page_send:getAttestationResult request');
  }, [padoServicePort]);
  useTimeout(timeoutFn, ATTESTATIONPOLLINGTIMEOUT, timeoutSwitch, false);
  useInterval(intervalFn, ATTESTATIONPOLLINGTIME, intervalSwitch, false);
  const [searchParams] = useSearchParams();
  const createFlag = searchParams.get('createFlag');
  const dispatch: Dispatch<any> = useDispatch();

  const credList: CredTypeItemType[] = useMemo(() => {
    let credArr = Object.values(credentialsObj);
    credArr = credArr.sort(
      (a, b) => Number(a.getDataTime) - Number(b.getDataTime)
    );
    return credArr;
  }, [credentialsObj]);
  const filteredCredList: CredTypeItemType[] = useMemo(() => {
    let activeList = credList;
    if (activeSourceType && activeSourceType !== 'All') {
      activeList = activeList.filter((i) => {
        const curProofTypeItem = proofTypes.find((j) => j.credTitle === i.type);
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

  const handleChangeTab = useCallback((val: string) => {}, []);
  const initCredList = useCallback(async () => {
    const cObj = await getCredentialsObjFromStorage();
    dispatch(setCredentialsAsync());
    setCredentialsObj(cObj);
  }, [dispatch]);
  const handleChangeProofType = useCallback((title: string) => {
    setCredTypesDialogVisible(false);
    setStep(1);
    setActiveAttestationType(title);
  }, []);
  const handleCloseMask = useCallback(() => {
    setStep(0);
  }, []);
  const validateBaseInfo = useCallback(
    (form: AttestionForm) => {
      const { source, baseValue } = form;
      const priceObj = exSources[source]?.tokenPriceMap;
      let totalAccBal;
      if (!priceObj) {
        return true;
      }
      if (source === 'okx') {
        const targetObj = exSources[source].tradingAccountTokenAmountObj;
        totalAccBal = Object.keys(targetObj).reduce((prev, curr) => {
          const num = targetObj[curr as keyof typeof targetObj];
          const price = priceObj[curr as keyof typeof priceObj];
          const curValue = mul(num, price).toFixed();
          prev = add(Number(prev), Number(curValue));
          return prev;
        }, BIGZERO);
      } else {
        const targetMap: AssetsMap = exSources[source].spotAccountTokenMap;
        totalAccBal = Object.keys(targetMap).reduce((prev, curr) => {
          const obj = targetMap[curr as keyof typeof targetMap];
          const curValue = obj.value;
          prev = add(Number(prev), Number(curValue));
          return prev;
        }, BIGZERO);
      }
      const totalBalance = totalAccBal.toFixed();
      if (gt(Number(baseValue), Number(totalBalance))) {
        setStep(2);
        setActiveRequest({
          type: 'warn',
          title: 'Not met the requirements',
          desc: 'Your request did not meet the necessary requirements. Please confirm and try again later.',
        });
        return false;
      }
      return true;
    },
    [exSources]
  );
  const onSubmitAttestationDialog = useCallback(
    async (form: AttestionForm, activeCred?: CredTypeItemType) => {
      // fetch balance first
      if (!validateBaseInfo(form)) {
        return;
      }
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
        desc: 'It may take a few seconds.',
      });
    },
    [padoServicePort, validateBaseInfo]
  );
  const onCancelAttestationDialog = useCallback(() => {
    setStep(0);
    setCredTypesDialogVisible(true);
  }, []);
  const onSubmitActiveRequestDialog = useCallback(() => {
    if (
      activeRequest?.type === 'suc' ||
      activeRequest?.type === 'error' ||
      activeRequest?.type === 'warn'
    ) {
      setStep(0);
      // refresh attestation list
      return;
    }
  }, [activeRequest?.type]);
  const onSubmitActiveSendToChainRequestDialog = useCallback(() => {
    if (
      activeSendToChainRequest?.type === 'suc' ||
      activeSendToChainRequest?.type === 'error' ||
      activeSendToChainRequest?.type === 'warn'
    ) {
      setStep(0);
      // refresh attestation list
      return;
    }
  }, [activeSendToChainRequest?.type]);
  const handleUpChain = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setStep(3);
    setSubmitAddress(undefined);
  }, []);
  const handleSubmitTransferToChain = useCallback((networkName?: string) => {
    // TODO
    if (networkName) {
      setActiveNetworkName(networkName);
      setStep(4);
    }
  }, []);
  const handleCancelTransferToChain = useCallback(() => {}, []);
  const handleBackConnectWallet = useCallback(() => {
    setStep(3);
  }, []);
  const handleSubmitConnectWallet = useCallback(
    async (wallet: WALLETITEMTYPE) => {
      // TODO
      setStep(5);
      setActiveSendToChainRequest({
        type: 'loading',
        title: 'Processing',
        desc: 'Please complete the transaction in your wallet.',
      });

      const targetNetwork = EASInfo[activeNetworkName as keyof typeof EASInfo];
      try {
        const [accounts, chainId, provider] = await connectWallet(
          targetNetwork
        );
        setSubmitAddress((accounts as string[])[0]);
        const { keyStore } = await chrome.storage.local.get(['keyStore']);
        const { address } = JSON.parse(keyStore);
        const upChainParams = {
          networkName: activeNetworkName,
          metamaskprovider: provider,
          receipt: '0x' + address,
          attesteraddr: PADOADDRESS,
          data: activeCred?.encodedData,
          signature: activeCred?.signature,
          type: activeCred?.type,
          schemaName: activeCred?.schemaName ?? 'EAS',
        };
        const upChainRes = await attestByDelegationProxy(upChainParams);
        if (upChainRes) {
          const cObj = await getCredentialsObjFromStorage();
          const curRequestid = activeCred?.requestid as string;
          const curCredential = credentialsObj[curRequestid];
          const newProvided = curCredential.provided ?? [];
          const currentChainObj: any = ONCHAINLIST.find(
            (i) => activeNetworkName === i.title
          );
          currentChainObj.attestationUID = upChainRes;
          currentChainObj.submitAddress = submitAddress;
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
            desc: 'Your wallet did not connect or refused to authorize. Please try again later.',
          });
        }
      } catch (e) {
        setActiveSendToChainRequest({
          type: 'error',
          title: 'Failed',
          desc: 'Your wallet did not connect or refused to authorize. Please try again later.',
        });
      }
    },
    [activeCred, activeNetworkName, credentialsObj, initCredList]
  );
  const handleViewQrcode = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setQrcodeVisible(true);
  }, []);
  const handleBindPolygonID = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setBindPolygonidVisible(true);
    //TODO
  }, []);
  const handleCloseQrcode = useCallback(() => {
    setQrcodeVisible(false);
    handleCloseMask();
  }, [handleCloseMask]);
  const handleCloseBindPolygonid = useCallback(() => {
    setBindPolygonidVisible(false);
  }, []);
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
  const clearFetchAttestationTimer = useCallback(() => {
    setIntervalSwitch(false);
  }, []);
  useEffect(() => {
    !intervalSwitch && setTimeoutSwitch(false);
  }, [intervalSwitch]);
  const handleAdd = useCallback(() => {
    if (activeRequest?.type === 'loading') {
      alert(
        'There is already a credential being processed. Please try again later.'
      );
      return;
    }
    setActiveCred(undefined);
    setCredTypesDialogVisible(true);
  }, [activeRequest?.type]);

  const getAttestationCallback = useCallback(() => {
    setTimeoutSwitch(true);
    setIntervalSwitch(true);
  }, []);
  const getAttestationResultCallback = useCallback(
    async (res: any) => {
      const { retcode, content } = JSON.parse(res);
      if (retcode === '0') {
        clearFetchAttestationTimer();

        if (content.balanceGreaterThanBaseValue === 'true') {
          const { activeRequestAttestation } = await chrome.storage.local.get([
            'activeRequestAttestation',
          ]);
          const parsedActiveRequestAttestation = activeRequestAttestation
            ? JSON.parse(activeRequestAttestation)
            : {};

          // console.log(
          //   'attestation',
          //   parsedActiveRequestAttestation,
          //   content
          // );
          const activeRequestId = parsedActiveRequestAttestation.requestid;
          if (activeRequestId !== content?.requestid) {
            return;
          }
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
            type: 'warn',
            title: 'Not met the requirements',
            desc: 'Your request did not meet the necessary requirements. Please confirm and try again later.',
          });
        }
      } else if (retcode === '2') {
        const msg = {
          fullScreenType: 'algorithm',
          reqMethodName: 'stop',
          params: {},
        };
        postMsg(padoServicePort, msg);
        setActiveRequest({
          type: 'warn',
          title: 'Something went wrong',
          desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
        });
      }
    },
    [clearFetchAttestationTimer, padoServicePort, initCredList]
  );
  useAlgorithm(getAttestationCallback, getAttestationResultCallback);

  const getCredentialsObjFromStorage = async (): Promise<CREDENTIALSOBJ> => {
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    return credentialObj;
  };
  const handleSubmitBindPolygonid = useCallback(async () => {
    setBindPolygonidVisible(false);
    await initCredList();
  }, [initCredList]);

  useEffect(() => {
    if (
      activeRequest?.type === 'suc' ||
      activeRequest?.type === 'error' ||
      activeRequest?.type === 'warn'
    ) {
      clearFetchAttestationTimer();
    }
  }, [clearFetchAttestationTimer, activeRequest?.type]);

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
  }, []);
  useEffect(() => {
    createFlag && handleAdd();
  }, [createFlag]);

  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} value="Cred" />
        <DataSourceSearch />
        <CredList
          list={filteredCredList}
          onUpChain={handleUpChain}
          onViewQrcode={handleViewQrcode}
          onBindPolygonID={handleBindPolygonID}
          onDelete={handleDeleteCred}
          onUpdate={handleUpdateCred}
          onAdd={handleAdd}
        />
        {step === 1 && (
          <AttestationDialog
            type={activeAttestationType}
            onClose={handleCloseMask}
            onSubmit={onSubmitAttestationDialog}
            activeCred={activeCred}
            onBack={onCancelAttestationDialog}
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
            headerType={
              activeCred?.did ? 'polygonIdAttestation' : 'attestation'
            }
            address={activeCred?.did as string}
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

        <BindPolygonID
          visible={bindPolygonidVisible}
          activeCred={activeCred}
          onClose={handleCloseBindPolygonid}
          onSubmit={handleSubmitBindPolygonid}
        />
      </main>
      {credList.length > 0 && <DataAddBar onClick={handleAdd} />}
      {credTypesDialogVisible && (
        <CredTypesDialog
          onClose={() => {
            setCredTypesDialogVisible(false);
          }}
          onSubmit={handleChangeProofType}
        />
      )}
    </div>
  );
});

export default Cred;
