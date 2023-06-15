import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PTabs from '@/components/PTabs';
import AssetsDetail from '@/components/DataSourceDetail/AssetsDetail';
import { ONEMINUTE, ATTESTATIONPOLLINGTIME, BIGZERO } from '@/config/constants';
import './index.sass';

import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import { ONCHAINLIST } from '@/config/envConstants';
import AttestationDialog from '@/components/Cred/AttestationDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import type { AttestionForm } from '@/components/Cred/AttestationDialog';
import type { CredTypeItemType } from '@/components/Cred/CredItem';
import { postMsg } from '@/utils/utils';
import type { ActiveRequestType } from '@/pages/DataSourceOverview';
import { add, mul, gt } from '@/utils/utils';
import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceItem';

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
  const clearFetchAttestationTimer = useCallback(() => {
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
  const validateBaseInfo = (form: AttestionForm) => {
    const { source, baseValue } = form;
    const priceObj = exSources[source].tokenPriceMap;
    let totalAccBal;
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
  };
  const onSubmitAttestationDialog = async (
    form: AttestionForm,
    activeCred?: CredTypeItemType
  ) => {
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
            console.log(`page_send:stop request`);
            fetchTimer && clearInterval(fetchTimer);
            setActiveRequest({
              type: 'warn',
              title: 'Something went wrong',
              desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
            });
          }, ONEMINUTE);
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
                type: 'warn',
                title: 'Not met the requirements',
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
