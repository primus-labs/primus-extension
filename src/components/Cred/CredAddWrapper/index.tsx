import React, {
  FC,
  useState,
  useMemo,
  useCallback,
  useEffect,
  memo,
} from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import AttestationDialog from '@/components/Cred/AttestationDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import CredTypesDialog from '@/components/Cred/CredTypesDialog';

import { postMsg } from '@/utils/utils';
import useTimeout from '@/hooks/useTimeout';
import useInterval from '@/hooks/useInterval';
import useAlgorithm from '@/hooks/useAlgorithm';
import {
  ATTESTATIONPOLLINGTIMEOUT,
  ATTESTATIONPOLLINGTIME,
  BIGZERO,
} from '@/config/constants';

import { setCredentialsAsync } from '@/store/actions';
import { add, mul, gt } from '@/utils/utils';
import { attestForAnt, validateAttestationForAnt } from '@/services/api/cred';
import type { ATTESTFORANTPARAMS } from '@/services/api/cred';

import type { Dispatch } from 'react';
import type { CredTypeItemType, AttestionForm } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { AssetsMap } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';

import './index.sass';

interface CredAddWrapperType {
  visible?: boolean;
  activeCred?: CredTypeItemType;
  onSubmit: () => void;
  onClose: () => void;
}
const CredAddWrapper: FC<CredAddWrapperType> = memo(
  ({ visible = true, activeCred, onClose, onSubmit }) => {
    console.log('CredAddWrapper');
    const [step, setStep] = useState(-1);
    const [activeAttestationType, setActiveAttestationType] =
      useState<string>('');
    // const [activeCred, setActiveCred] = useState<CredTypeItemType>();
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
    const [activeSourceName, setActiveSourceName] = useState<string>();
    
    const [timeoutSwitch, setTimeoutSwitch] = useState<boolean>(false);
    const [intervalSwitch, setIntervalSwitch] = useState<boolean>(false);
    const [searchParams] = useSearchParams();
    // const sourceName = (searchParams.get('name') as string)?.toLowerCase();
    const createFlag = searchParams.get('createFlag')?.toLowerCase();
    
    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );
    const exSources = useSelector((state: UserState) => state.exSources);

    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );

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

    const dispatch: Dispatch<any> = useDispatch();

    const initCredList = useCallback(async () => {
      await dispatch(setCredentialsAsync());
    }, [dispatch]);
    const handleChangeProofType = useCallback((title: string) => {
      setActiveAttestationType(title);
      setStep(1);
    }, []);
    const handleCloseMask = useCallback(() => {
      setStep(-1);
      onClose();
    }, [onClose]);
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
    const userInfo = useSelector((state: UserState) => state.userInfo);
    const requestConfigParams = useMemo(() => {
      const { token } = userInfo;
      const requestConfigParams = {
        extraHeader: {
          Authorization: `Bearer ${token}`,
        },
      };
      return requestConfigParams;
    }, [userInfo]);
    const fetchAttestForAnt = useCallback(async (form: AttestionForm) => {
      setStep(2);
      setActiveRequest({
        type: 'loading',
        title: 'Attestation is processing',
        desc: 'It may take a few seconds.',
      });
      const { credential, userIdentity, verifyIdentity, proofType } = form;
      const params = {
        credential,
        userIdentity,
        verifyIdentity,
        proofType,
      };
      try {
        const { rc, result } = await attestForAnt(
          params as ATTESTFORANTPARAMS,
          requestConfigParams
        );
        if (rc === 0) {
          // setActiveKYCApplication(result)
          const { salt, rootHash, proof } = result;
          const params2 = {
            proof,
            salt,
            rootHash,
            userIdentity: walletAddress,
          };
          const { rc: rc2, result: result2 } = await validateAttestationForAnt(
            params2,
            requestConfigParams
          );
          if (rc2 === 0) {
            // TODO!!!
            // const activeRequestId = parsedActiveRequestAttestation.requestid;
            // if (activeRequestId !== content?.requestid) {
            //   return;
            // }
            // const fullAttestation = {
            //   ...content,
            //   ...parsedActiveRequestAttestation,
            // };
            const credentialsObj = { ...credentialsFromStore };
            const activeRequestId = +new Date();
            // // credentialsObj[activeRequestId] = fullAttestation;
            credentialsObj[activeRequestId] = {
              address: '0x6e77d0fbb1a48db5f2708816b8fa9b2e9b8ad62f',
              authUseridHash:
                '0x5b86827803b0e75ac3c186270b1222c7f418a2f6afe8e56d8f7a1cd713845c77',
              // balanceGreaterThanBaseValue: 'true',
              // baseValue: '1000',
              data: '',
              encodedData:
                '0x00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000005b86827803b0e75ac3c186270b1222c7f418a2f6afe8e56d8f7a1cd713845c770000000000000000000000006e77d0fbb1a48db5f2708816b8fa9b2e9b8ad62f00000000000000000000000000000000000000000000000000000189240e0d9100000000000000000000000000000000000000000000000000000000000003e80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000762696e616e636500000000000000000000000000000000000000000000000000',
              getDataTime: activeRequestId + '',
              requestid: activeRequestId + '',
              signature:
                '0xe7bf69d7f9a01aa8a4f921d68006a420abc67a3a41fccd4e4051d3f2a731f3f006985865804a09d4a8c67b135d91e7c966402177a21ed008759f96e18c35e9661b',
              source: 'zan',
              sourceUseridHash: '',
              version: '1.0.0',
              type: 'IDENTIFICATION_PROOF',
              user: {
                userid: '1658657962270392320',
                address: '0x6e77d0fbb1a48db5f2708816b8fa9b2e9b8ad62f',
                token:
                  'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJwYWRvbGFicy5vcmciLCJzdWIiOiJlaGlzcGVyIiwiZXhwIjo0ODQwNTgxNjU2LCJ1c2VyLWlkIjoxNjU4NjU3OTYyMjcwMzkyMzIwLCJzY29wZSI6ImF1dGgifQ.A7BkcdVuEUEeuHXYcEjDRwjXqpqJnSOlMiFjBA3_epXPFCuq4rnUnSPRl1f_Ov3tcfwf2QxC3Q9vuxt4yOoD3c5W4iT_6Lf9bTMXJTaIAQ4XuAHbBTgaoyh8pdbezoWxNRVT4yYf8zOIy9LXLxnjCSdPiFE5t3XRxScCmwfny3QCXQE-qyHClw_FPsrm1_Ywflx9198jQz46YfYx4k7C5hy4uBRyLmYgrRUurLAOBq4HAg1Eofc7MxbpBV7xZ6JehhCoaraGOIbp6Be5NnoVb8xSyUMdIDVzaaHtjXNNC_blYsQflIqZIcNrZDs6-SbuSHmPUSoReHxRjcxuFmG-Uw',
              },
              credential,
            };
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsObj),
            });
            // await chrome.storage.local.remove(['activeRequestAttestation']);
            await initCredList();
            setActiveRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Your proof is created!',
            });
          }
        }
      } catch {
        alert('attestForAnt network error');
      }
    }, []);
    const onSubmitAttestationDialog = useCallback(
      async (form: AttestionForm, curCred?: CredTypeItemType) => {
        if (form.type === 'ASSETS_PROOF') {
          // fetch balance first
          if (!validateBaseInfo(form)) {
            return;
          }
        }
        if (form.type === 'IDENTIFICATION_PROOF') {
          fetchAttestForAnt(form);
        } else {
          // if curCred is update,not add
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
        }
      },
      [padoServicePort, validateBaseInfo, fetchAttestForAnt]
    );
    const onBackAttestationDialog = useCallback(() => {
      setStep(0);
    }, []);
    const onSubmitActiveRequestDialog = useCallback(() => {
      if (
        activeRequest?.type === 'suc' ||
        activeRequest?.type === 'error' ||
        activeRequest?.type === 'warn'
      ) {
        setStep(-1);
        // refresh attestation list
        onSubmit();
        return;
      }
    }, [activeRequest?.type]);

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
      // setActiveCred(undefined);
      setStep(0);
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
            const { activeRequestAttestation } = await chrome.storage.local.get(
              ['activeRequestAttestation']
            );
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

            const credentialsObj = { ...credentialsFromStore };
            credentialsObj[activeRequestId] = fullAttestation;
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsObj),
            });
            await chrome.storage.local.remove(['activeRequestAttestation']);

            await initCredList();
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
      [
        clearFetchAttestationTimer,
        padoServicePort,
        initCredList,
        credentialsFromStore,
      ]
    );
    useAlgorithm(getAttestationCallback, getAttestationResultCallback);

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
      if (visible) {
        setStep(-1)
        setActiveAttestationType('')
        setActiveSourceName(undefined)
       
        if (activeCred) {
          setStep(1);
          setActiveAttestationType(activeCred?.type);
          setActiveSourceName(activeCred?.source);
        } else {
          setActiveSourceName(undefined);
          if (createFlag) {
            setActiveSourceName(createFlag);
          }
          handleAdd();
        }
      }
    }, [visible, createFlag, activeCred]);

    return (
      <div className={visible ? 'credAddWrapper' : 'credAddWrapper hidden'}>
        {visible && step === 0 && (
          <CredTypesDialog
            onClose={handleCloseMask}
            onSubmit={handleChangeProofType}
          />
        )}
        {visible && step === 1 && (
          <AttestationDialog
            type={activeAttestationType}
            activeSourceName={activeSourceName}
            activeCred={activeCred}
            onBack={onBackAttestationDialog}
            onClose={handleCloseMask}
            onSubmit={onSubmitAttestationDialog}
          />
        )}
        {visible && step === 2 && (
          <AddSourceSucDialog
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerType="attestation"
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveRequestDialog}
          />
        )}
      </div>
    );
  }
);

export default CredAddWrapper;
