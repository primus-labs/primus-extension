import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { UserState } from '@/types/store';
import { eventReport } from '@/services/api/usertracker';
import useInterval from './useInterval';
import { BASEVENTNAME } from '@/config/events';
import useEventDetail from './useEventDetail';
import useAllSources from './useAllSources';
import { formatAddress } from '@/utils/utils';
import { switchAccount, requestSign } from '@/services/wallets/metamask';
import {
  claimUniNFT,
  getUniNFTResult,
  getUniswapProof,
} from '@/services/api/event';
import { useDispatch } from 'react-redux';
import { initRewardsActionAsync, setCredentialsAsync, setAttestLoading } from '@/store/actions';
import { CredVersion } from '@/config/attestation';
import type { Dispatch } from 'react';
type CreateAuthWindowCallBack = (
  state: string,
  source: string,
  window?: chrome.windows.Window | undefined,
  onSubmit?: (p: any) => void,
  needCheckLogin?: boolean
) => void;
type OauthFn = (source: string, onSubmit?: (p: any) => void) => void;

const errorDescEl = ''
const useAttestBrevis = () => {
  const { sourceMap2 } = useAllSources();
  const [BASEventDetail] = useEventDetail(BASEVENTNAME);

  const [authWindowId, setAuthWindowId] = useState<number>();
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>();
  const [checkIsJoinDialogTimer, setCheckIsJoinDialogTimer] = useState<any>();
  const [claimResult, setClaimResult] = useState<any>({});
  const dispatch: Dispatch<any> = useDispatch();
  const [uniSwapProofRequestId, setUniSwapProofRequestId] =
    useState<string>('');
  const [activeSourceName, setActiveSourceName] = useState<string>();
  const [uniSwapProofParams, setUniSwapProofParams] = useState<any>({});
  const [activeAttestForm, setActiveAttestForm] = useState<any>({});
  const [activeRequest, setActiveRequest] = useState<any>();
  const [searchParams] = useSearchParams();
  const fromEvents = searchParams.get('id');
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );

  const switchAccountFn = useCallback(
    async (form) => {
      const formatAddr = formatAddress(
        form?.sourceUseridHash || '',
        7,
        5,
        '......'
      );
      setActiveRequest({
        type: 'loading',
        title: 'Requesting Connection',
        desc: `Check MetaMask to confirm the connection with ${formatAddr}`,
      });
      await switchAccount(connectedWallet?.provider);
      setActiveRequest(undefined);
      setActiveSourceName(form?.account.toLowerCase());
      // setStep(1);
    },
    [connectedWallet?.provider]
  );
  const [pollingUniProofIntervalSwitch, setPollingUniProofIntervalSwitch] =
    useState<boolean>(false);
  const initCredList = useCallback(async () => {
    dispatch(setCredentialsAsync());
  }, [dispatch]);
  const pollingUniProofResult = useCallback(async () => {
    try {
      const { rc, result } = await getUniNFTResult({
        address: claimResult.address,
        blockNumber: claimResult.blockNumber,
      });
      if (rc === 0 && result) {
        setPollingUniProofIntervalSwitch(false);
        const {
          dataSignatureResponse: { result : dataSignatureResponseResult, ...otherResponse },
          dataSignatureParams,
        } = result;
        var eventInfo: any = {
          eventType: 'API_ATTESTATION_GENERATE',
          rawData: {
            source: 'brevis',
            schemaType: 'BREVIS_TRANSACTION_PROOF#1', // UNISWAP_PROOF
            sigFormat: 'EAS-Ethereum',
            attestationId: uniSwapProofRequestId,
            event: fromEvents,
          },
        };

        const fullAttestation = {
          ...dataSignatureResponseResult,
          ...otherResponse,
          ...dataSignatureParams,
          address: connectedWallet?.address,
          source: activeAttestForm.dataSourceId,
          ...activeAttestForm,
          requestid: uniSwapProofRequestId,
          event: fromEvents,
          version: CredVersion,
          credVersion: CredVersion,
          type: 'BREVIS_TRANSACTION_PROOF#1',
          templateId: '101', // brevis template id
        };
        const credentialsObj = { ...credentialsFromStore };
        credentialsObj[uniSwapProofRequestId] = fullAttestation;
        await chrome.storage.local.set({
          credentials: JSON.stringify(credentialsObj),
        });
        await initCredList();
        eventInfo.rawData.status = 'SUCCESS';
        eventInfo.rawData.reason = '';
        eventReport(eventInfo);
        setActiveRequest({
          type: 'suc',
          title: 'Attestation created!',
          desc: '',
        });
        dispatch(setAttestLoading(2));
      } else {
      }
    } catch {
    } finally {
    }
  }, [
    uniSwapProofRequestId,
    fromEvents,
    connectedWallet?.address,
    activeAttestForm,
    credentialsFromStore,
    initCredList,
    dispatch,
    claimResult,
  ]);
  useInterval(
    pollingUniProofResult,
    10000,
    pollingUniProofIntervalSwitch,
    false
  );
  const attestBrevisFn = useCallback(async (form) => {
    setActiveAttestForm(form);
    try {
      const curRequestId = uuidv4();
      setUniSwapProofRequestId(curRequestId);
      const curConnectedAddr = connectedWallet?.address;
      // const curConnectedAddr = '0x4813e2ea41ff0e8ff2f60cc484bc832776314980'; // DEL!!!-TEST-brevis
      const timestamp: string = +new Date() + '';
      const signature = await requestSign(form?.account, timestamp);
      if (!signature) {
        setActiveRequest({
          type: 'warn',
          title: 'Unable to proceed',
          desc: 'Not complete the signature request in your wallet.',
        });
        dispatch(setAttestLoading(3));
        return;
      }
      const proofParams = {
        signature,
        address: curConnectedAddr,
        provider: connectedWallet?.provider,
      };
      setUniSwapProofParams(proofParams);
      const { rc, result, mc } = await claimUniNFT({
        signature,
        address: curConnectedAddr,
        timestamp,
      });

      if (rc === 0 && result) {
        setClaimResult({ ...result, address: curConnectedAddr });
        setPollingUniProofIntervalSwitch(true);
      } else {
        setActiveRequest({
          type: 'fail',
          title: 'Verification failed',
          desc: 'Do not have eligible transactions.',
          btnTxt: '',
        });
        dispatch(setAttestLoading(3));
      }
    } catch (e) {
      setActiveRequest({
        type: 'fail',
        title: 'Verification failed',
        desc: 'The attestation process has been interrupted for some unknown service breakdown. Please try again later.',
      });
      dispatch(setAttestLoading(3));
    }
  }, []);

  return { attestBrevisFn, attestBrevisRequestProcess: activeRequest };
};

export default useAttestBrevis;
