import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PTabs from '@/components/PTabs';
import AssetsDetail from '@/components/DataSourceDetail/AssetsDetail';
import { ATTESTATIONTIMEOUT, ATTESTATIONPOLLINGTIME } from '@/config/constants';
import './index.sass';

import type { ExDataType } from '@/hooks/useExSource';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import { ONCHAINLIST } from '@/config/envConstants';
import AttestationDialog from '@/components/Cred/AttestationDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import type { AttestionForm } from '@/components/Cred/AttestationDialog';
import type { CredTypeItemType } from '@/components/Cred/CredItem';
import { postMsg } from '@/utils/utils';
import type { ActiveRequestType } from '@/pages/DataSourceOverview';

type CREDENTIALSOBJ = {
  [propName: string]: CredTypeItemType;
};
const DataSourceDetail = () => {
  const [fetchAttestationTimer, setFetchAttestationTimer] = useState<any>();
  const [fetchTimeoutTimer, setFetchTimeoutTimer] = useState<any>();
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const [activeAttestationType, setActiveAttestationType] =
    useState<string>('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceName = (searchParams.get('name') as string).toLowerCase();
  const exSources = useSelector((state: UserState) => state.exSources);
  const activeSource = useMemo(() => {
    return exSources[sourceName] ?? {};
  }, [exSources, sourceName]);
  const [step, setStep] = useState(0);
  const [assetsProveFlag, setAssetsProveFlag] = useState<boolean>(false);
  const [userProveFlag, setUserProveFlag] = useState<boolean>(false);
  const handleChangeTab = (val: string) => {
    navigate('/datas');
  };
  const handleCloseMask = () => {
    setStep(0);
  };
  const handleProve = (type: string) => {
    setActiveAttestationType(type);
    if (type === 'Assets Proof') {
      if (assetsProveFlag) {
        navigate('/cred');
      } else {
        setStep(1);
      }
    } else {
      if (userProveFlag) {
        navigate('/cred');
      } else {
        setStep(1);
      }
    }
  };

  const clearFetchTimeoutTimer = useCallback(() => {
    fetchTimeoutTimer && clearTimeout(fetchTimeoutTimer);
  }, [fetchTimeoutTimer]);
  const clearFetchAtteatationTimer = useCallback(() => {
    if (fetchAttestationTimer) {
      clearInterval(fetchAttestationTimer);
      clearFetchTimeoutTimer();
    }
  }, [fetchAttestationTimer, clearFetchTimeoutTimer]);
  useEffect(() => {
    initAlgorithm();
    return () => {
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    };
  }, []);
  useEffect(() => {
    return () => {
      clearFetchAtteatationTimer();
    };
  }, [clearFetchAtteatationTimer]);
  useEffect(() => {
    return () => {
      clearFetchTimeoutTimer();
    };
  }, [clearFetchTimeoutTimer]);

  useEffect(() => {
    if (
      fetchAttestationTimer &&
      (activeRequest?.type === 'suc' ||
        activeRequest?.type === 'error' ||
        activeRequest?.type === 'warn')
    ) {
      clearInterval(fetchAttestationTimer);
    }
  }, [fetchAttestationTimer, activeRequest]);

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
      // TODO refresh attestation list
      return;
    }
  };
  const getCredentialsObjFromStorage = async (): Promise<CREDENTIALSOBJ> => {
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    return credentialObj;
  };
  const initCredList = useCallback(async () => {
    const cObj = await getCredentialsObjFromStorage();
    const curExCred = Object.values(cObj).find((i) => i.source === sourceName);
    setAssetsProveFlag(!!curExCred);
  }, [sourceName]);

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
            clearFetchAtteatationTimer();
            // TODO balanceGreaterThanBaseValue
            if (
              content.balanceGreaterBaseValue === 'true' ||
              content.balanceGreaterThanBaseValue === 'true'
            ) {
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
            } else if (
              content.balanceGreaterBaseValue === 'false' ||
              content.balanceGreaterThanBaseValue === 'false'
            ) {
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
        if (res.retcode === '0') {
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
  useEffect(() => {
    initAlgorithm();
    return () => {
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    };
  }, []);
  useEffect(() => {
    initCredList();
  }, []);

  return (
    <div className="pageDataSourceDetail">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <AssetsDetail
          onProve={handleProve}
          assetsProveFlag={assetsProveFlag}
          userProveFlag={userProveFlag}
        />
      </main>
      {step === 1 && (
        <AttestationDialog
          type={activeAttestationType}
          onClose={handleCloseMask}
          onSubmit={onSubmitAttestationDialog}
          activeSourceName={sourceName}
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
    </div>
  );
};

export default DataSourceDetail;
