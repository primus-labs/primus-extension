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

import Bridge from '@/components/DataSourceOverview/Bridge/index';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import AttestationDialog from './AttestationDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import CredTypesDialog from './CredTypesDialog';

import { postMsg,strToHex } from '@/utils/utils';
import useTimeout from '@/hooks/useTimeout';
import useInterval from '@/hooks/useInterval';
import useAlgorithm from '@/hooks/useAlgorithm';
import {
  ATTESTATIONPOLLINGTIMEOUT,
  ATTESTATIONPOLLINGTIME,
  BIGZERO,
  ONESECOND,
  ONEMINUTE,
  CredVersion,
} from '@/config/constants';
import {getPadoUrl, getProxyUrl} from '@/config/envConstants'
import { STARTOFFLINETIMEOUT } from '@/config/constants';
import { setCredentialsAsync } from '@/store/actions';
import {
  add,
  mul,
  gt,
  assembleUserInfoParams,
} from '@/utils/utils';
import {
  attestForAnt,
  validateAttestationForAnt,
  attestForPolygonId,
} from '@/services/api/cred';


import { DATASOURCEMAP } from '@/config/constants';
import type { WALLETITEMTYPE } from '@/config/constants';
import type { ATTESTFORANTPARAMS } from '@/services/api/cred';
import type { Dispatch } from 'react';
import type { CredTypeItemType, AttestionForm } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { AssetsMap } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';

import './index.sass';

const onChainObj:any = DATASOURCEMAP.onChain;
const schemaTypeMap = {
  ASSETS_PROOF: 'Assets Proof',
  TOKEN_HOLDINGS: 'Token Holdings',
  IDENTIFICATION_PROOF: 'IDENTIFICATION_PROOF',
};
interface CredAddWrapperType {
  visible?: boolean;
  activeCred?: CredTypeItemType;
  activeSource?: string;
  onSubmit: () => void;
  onClose: () => void;
  type?: string;
}
const CredAddWrapper: FC<CredAddWrapperType> = memo(
  ({ visible = true, activeCred, activeSource, onClose, onSubmit, type }) => {
    const [step, setStep] = useState(-1);
    const [activeAttestationType, setActiveAttestationType] =
      useState<string>('');
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
    const [activeSourceName, setActiveSourceName] = useState<string>();

    const [timeoutSwitch, setTimeoutSwitch] = useState<boolean>(false);
    const [intervalSwitch, setIntervalSwitch] = useState<boolean>(false);
    const [activeAttestForm, setActiveAttestForm] = useState<any>();

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
            desc: (
              <>
                <p>
                  Insufficient assets in your{' '}
                  {source === 'okx' ? 'Trading' : 'Spot'} Account.
                </p>
                <p>Please confirm and try again later.</p>
              </>
            ),
          });
          return false;
        }
        return true;
      },
      [exSources]
    );
    const userInfo = useSelector((state: UserState) => state.userInfo);
    const requestConfigParams = useMemo(() => {
      const { id } = userInfo;
      const rCParams = {
        extraHeader: {
          'user-id': id,
        },
      };
      return rCParams;
    }, [userInfo]);
    const fetchAttestForPolygonID = useCallback(async () => {
      try {
        const { id } = userInfo;
        const {
          type,
          signature,
          source,
          getDataTime,
          address,
          baseValue,
          balanceGreaterThanBaseValue,
          exUserId,
          holdingToken,
          requestid, // last sessionId
          did,
        } = activeCred as CredTypeItemType;

        const params: any = {
          sessionId: requestid,
          credType: schemaTypeMap[type as keyof typeof schemaTypeMap],
          signature,
          credentialSubject: {
            id: did,
            source,
            sourceUserId: exUserId,
            authUserId: id,
            getDataTime,
            recipient: address,
            baseValue,
            balanceGreaterThanBaseValue,
          },
          update: 'true',
        };
        if (type === 'TOKEN_HOLDINGS') {
          params.credentialSubject.asset = holdingToken;
        }
        const res = await attestForPolygonId(params, requestConfigParams);
        if (res?.getDataTime) {
          const newRequestId = requestid;
          const fullAttestation = {
            ...activeCred,
            did,
            ...res,
            requestid: newRequestId,
            issuer: res.claimQrCode.from,
            schemaName: 'PolygonID',
            provided: [],
            signature: res.claimSignatureInfo.signature,
            encodedData: res.claimSignatureInfo.encodedData,
            version: CredVersion,
          };

          const { credentials: credentialsStr } =
            await chrome.storage.local.get(['credentials']);
          const credentialsObj = credentialsStr
            ? JSON.parse(credentialsStr)
            : {};
          credentialsObj[newRequestId] = fullAttestation;
          await chrome.storage.local.set({
            credentials: JSON.stringify(credentialsObj),
          });
          await initCredList();
          setActiveRequest({
            type: 'suc',
            title: 'Congratulations',
            desc: 'A new attestation with Polygon DID is successfully granted!',
          });
        } else {
          setActiveRequest({
            type: 'error',
            title: 'Failed',
            desc: 'Failed to grant new authentication to Polygon DID!',
          });
          alert('attestForPolygonId network error');
        }
      } catch {
        setActiveRequest({
          type: 'error',
          title: 'Failed',
          desc: 'Failed to grant new authentication to Polygon DID!',
        });
        alert('attestForPolygonId network error');
      }
    }, [activeCred, userInfo, initCredList, requestConfigParams]);
    const fetchAttestForAnt = useCallback(
      async (form: AttestionForm) => {
        const {
          credential,
          userIdentity,
          verifyIdentity,
          proofType,
          source,
          type,
          exUserId,
          label,
        } = form;
        const params = {
          credential,
          userIdentity,
          verifyIdentity,
          proofType,
        };
        try {
          const { rc, result, msg } = await attestForAnt(
            params as ATTESTFORANTPARAMS,
            {
              ...requestConfigParams,
              timeout: 30 * ONESECOND,
            }
          );
          if (rc === 0) {
            // setActiveKYCApplication(result)
            const { salt, rootHash, proof } = result;
            const params2 = {
              proof,
              salt,
              rootHash,
              userIdentity: walletAddress,
              source,
              // sigFormat: 'EAS-BNB'
            };
            const {
              rc: rc2,
              result: result2,
              msg: msg2,
            } = await validateAttestationForAnt(params2, {
              ...requestConfigParams,
              timeout: ONEMINUTE,
            });
            if (rc2 === 0) {
              const credentialsObj = { ...credentialsFromStore };
              const activeRequestId = activeCred?.requestid ?? +new Date();
              // // credentialsObj[activeRequestId] = fullAttestation;

              const user = await assembleUserInfoParams();

              credentialsObj[activeRequestId] = {
                type,
                requestid: activeRequestId + '',
                source,
                sourceUseridHash: '',
                address: walletAddress,
                label,
                credential,
                ...result2,

                sigFormat: 'EAS-Ethereum',
                schemaType: type,
                user,
                version: CredVersion,
              };

              await chrome.storage.local.set({
                credentials: JSON.stringify(credentialsObj),
              });
              await initCredList();
              setActiveRequest({
                type: 'suc',
                title: 'Congratulations',
                desc: 'Your proof is created!',
              });
            } else {
              setActiveRequest(undefined);
              alert(msg2);
            }
          } else {
            setActiveRequest(undefined);
            setStep(-1);
            alert(msg);
          }
        } catch {
          setStep(-1);
          setActiveRequest(undefined);
          alert('attestForAnt network error');
        }
      },
      [
        credentialsFromStore,
        requestConfigParams,
        initCredList,
        walletAddress,
        activeCred?.requestid,
      ]
    );
    const onSubmitAttestationDialog = useCallback(
      async (form: AttestionForm) => {
        setActiveAttestForm(form);
        setStep(2);
        let loadingObj = {
          type: 'loading',
          title: 'Attestation is processing',
          desc: 'It may take a few seconds.',
        };
        if (form.source === 'metamask') {
          loadingObj = {
            type: 'loading',
            title: 'Processing',
            desc: 'Please complete the transaction in your wallet.',
          };
        }
        setActiveRequest(loadingObj);
        if (activeCred?.did) {
          fetchAttestForPolygonID();
        } else {
          if (form.type === 'UNISWAP_PROOF') {
            // TODO
          } else if (form.type === 'IDENTIFICATION_PROOF') {
            fetchAttestForAnt(form);
          } else {
            if (form.type === 'ASSETS_PROOF') {
              // fetch balance first
              if (!validateBaseInfo(form)) {
                return;
              }
            }
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
          }
        }
      },
      [
        padoServicePort,
        validateBaseInfo,
        fetchAttestForAnt,
        activeCred?.did,
        fetchAttestForPolygonID,
      ]
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
        initCredList();
        onSubmit();
        return;
      }
    }, [activeRequest?.type, initCredList, onSubmit]);

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
        onClose();
        return;
      }
      // setActiveCred(undefined);
      setStep(0);
    }, [activeRequest?.type]);

    const getAttestationCallback = useCallback((res: any) => {
      const { retcode, retdesc } = JSON.parse(res);
      if (retcode === '0') {
        setTimeoutSwitch(true);
        setIntervalSwitch(true);
      } else if (retcode === '2') {
        // algorithm is not initialized
        setActiveRequest({
          type: 'error',
          title: 'Failed',
          desc: retdesc,
        });
      }
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
            let descItem1 =
              'Your request did not meet the necessary requirements.';
            if (activeAttestForm.type === 'ASSETS_PROOF') {
              descItem1 = `Insufficient assets in your ${
                activeAttestForm.source === 'okx' ? 'Trading' : 'Spot'
              } Account.`;
            }
            setActiveRequest({
              type: 'warn',
              title: 'Not met the requirements',
              desc: (
                <>
                  <p>{descItem1}</p>
                  <p>Please confirm and try again later.</p>
                </>
              ),
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
        activeAttestForm,
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
        setStep(-1);
        setActiveAttestationType('');
        setActiveSourceName(undefined);
        if (activeCred) {
          setStep(1);
          setActiveAttestationType(activeCred?.type);
          setActiveSourceName(activeCred?.source);
        } else {
          setActiveSourceName(undefined);
          if (activeSource) {
            setActiveSourceName(activeSource);
          }
          handleAdd();
        }
      }
    }, [visible, activeSource, activeCred]);
    useEffect(() => {
      if (!activeRequest?.type) {
        onClose();
      }
    }, [activeRequest?.type, onClose]);
    const startOfflineFn = useCallback(async () => {
      const padoUrl = await getPadoUrl();
      const proxyUrl = await getProxyUrl();
      postMsg(padoServicePort, {
        fullScreenType: 'algorithm',
        reqMethodName: 'startOffline',
        params: {
          offlineTimeout: STARTOFFLINETIMEOUT,
          padoUrl,
          proxyUrl,
        },
      });
    }, [padoServicePort]);
    useEffect(() => {
      visible && startOfflineFn();
    }, [visible, startOfflineFn]);
    const resultDialogHeaderEl = useMemo(() => {
      return activeAttestForm?.source === 'metamask' ? (
        <Bridge endIcon={onChainObj.icon} />
      ) : (
        <AddressInfoHeader />
      );
    }, [activeAttestForm]);
    return (
      <div className={'credAddWrapper'}>
        {visible && step === 0 && (
          <CredTypesDialog
            onClose={handleCloseMask}
            onSubmit={handleChangeProofType}
            type={type}
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
            headerEl={resultDialogHeaderEl}
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveRequestDialog}
          />
        )}
      </div>
    );
  }
);

export default CredAddWrapper;
