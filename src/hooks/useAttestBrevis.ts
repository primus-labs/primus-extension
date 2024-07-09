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
import { initRewardsActionAsync, setCredentialsAsync } from '@/store/actions';
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

const useAttestBrevis = () => {
  const { sourceMap2 } = useAllSources();
  const [BASEventDetail] = useEventDetail(BASEVENTNAME);

  const [authWindowId, setAuthWindowId] = useState<number>();
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>();
  const [checkIsJoinDialogTimer, setCheckIsJoinDialogTimer] = useState<any>();

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
        requestId: uniSwapProofRequestId,
      });
      if (rc === 0) {
        const {
          status,
          reason,
          nft,
          transactionHash,
          swapSizeDollars,
          signatureInfo,
          signatureRawInfo,
        } = result;
        var eventInfo: any = {
          eventType: 'API_ATTESTATION_GENERATE',
          rawData: {
            source: 'brevis',
            schemaType: 'UNISWAP_PROOF',
            sigFormat: 'EAS-Ethereum',
            attestationId: uniSwapProofRequestId,
            // status: 'SUCCESS',
            // reason: '',
            event: fromEvents,
          },
        };
        if (status === 'COMPLETE' || status === 'ERROR') {
          setPollingUniProofIntervalSwitch(false);
        }
        // store nft & proof
        if (status === 'COMPLETE') {
          // store nft & credit
          const { rewards } = await chrome.storage.local.get(['rewards']);
          const newRewardsObj = rewards ? JSON.parse(rewards) : {};
          newRewardsObj['brevis' + uniSwapProofRequestId] = {
            title: nft.nftTitle,
            name: nft.nftName,
            image: nft.image,
            nftAddress: nft.nftAddress,
            accountAddress: activeAttestForm?.address.toLowerCase(),
            type: 'NFT',
            event: 'brevis',
          };
          await chrome.storage.local.set({
            rewards: JSON.stringify(newRewardsObj),
          });
          await dispatch(initRewardsActionAsync());
          const fullAttestation = {
            ...signatureInfo,
            ...signatureRawInfo,
            nft,
            address: connectedWallet?.address,
            ...activeAttestForm,
            version: CredVersion,
            requestid: uniSwapProofRequestId,
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
            title: 'Congratulations',
            desc: 'Successfully get your rewards.',
          });
          // setActiveRequest({
          //   type: 'suc',
          //   title: 'Congratulations',
          //   desc: 'Your proof is created!',
          // });
        }
        if (status === 'ERROR') {
          //         const resonMap = {
          //           SIGNATURE_WRONG
          // NO_ELIGIBILITY：
          // INTERNAL_ERROR：
          // TRANSACTION_ERROR:
          // UNKNOWN：
          // SUCCESS：
          //         }

          if (reason === 'NO_ELIGIBILITY') {
            setActiveRequest({
              type: 'warn',
              title: 'Not meet the requirements',
              desc: 'Do not have an eligible transaction. ',
              btnTxt: '',
            });
          } else if (reason === 'UNKNOWN') {
            setActiveRequest({
              type: 'warn',
              title: 'Unable to proceed',
              desc: 'Some transaction error occurs. Please try again later.',
              btnTxt: '',
            });
          } else {
            setActiveRequest({
              type: 'warn',
              title: 'Something went wrong',
              desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
            });
          }
          eventInfo.rawData.status = 'FAILED';
          eventInfo.rawData.reason = reason;
          eventReport(eventInfo);
        }
      }
    } catch {
      setActiveRequest({
        type: 'warn',
        title: 'Something went wrong',
        desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
      });
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
  ]);
  useInterval(
    pollingUniProofResult,
    3000,
    pollingUniProofIntervalSwitch,
    false
  );
  const attestBrevisFn = useCallback(async (form) => {
    setActiveAttestForm(form);
    try {
      const curRequestId = uuidv4();
      setUniSwapProofRequestId(curRequestId);
      // const curConnectedAddr = connectedWallet?.address;
      const curConnectedAddr = '0xfb19212dc11a7c6f00aadf685cc00f97b4c17011'; // stone TODO DEL!!!222123
      const timestamp: string = +new Date() + '';
      const signature = await requestSign(form?.account, timestamp); // TODO DEL !!!
      // if (!signature) {
      //   setActiveRequest({
      //     type: 'warn',
      //     title: 'Unable to proceed',
      //     desc: errorDescEl,
      //   });
      //   return;
      // }
      const proofParams = {
        signature,
        address: curConnectedAddr,
        provider: connectedWallet?.provider,
      };
      setUniSwapProofParams(proofParams);
      const { rc, result, msg } = await claimUniNFT({
        requestId: curRequestId,
        signature,
        address: curConnectedAddr,
        timestamp,
      });

      if (rc === 0 && result) {
        setPollingUniProofIntervalSwitch(true);
      } else {
        // setActiveRequest({
        //   type: 'error',
        //   title: 'Failed',
        //   desc: msg,
        // });
      }
    } catch (e) {
      // setActiveRequest({
      //   type: 'warn',
      //   title: 'Unable to proceed',
      //   desc: errorDescEl,
      // });
    }
  }, []);

  return { attestBrevisFn, attestBrevisRequestProcess: activeRequest };
};

export default useAttestBrevis;
