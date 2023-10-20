import React, {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import ClaimDialog from './ClaimDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import RewardsDialog from './RewardsDialog'
import {
  ONCHAINLIST,
  PADOADDRESS,
  EASInfo,
  CLAIMNFTNETWORKNAME
} from '@/config/envConstants';
import { connectWallet } from '@/services/wallets/metamask';
import { mintWithSignature } from '@/services/chains/erc721';
import { getEventSignature, getNFTInfo } from '@/services/api/event';
import { initRewardsActionAsync } from '@/store/actions';
import { getAuthUserIdHash } from '@/utils/utils';
import useAllSources from '@/hooks/useAllSources';
import type { WALLETITEMTYPE } from '@/types/config';
import type { ActiveRequestType } from '@/types/config';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';
import type { Dispatch } from 'react';
import { eventReport } from '@/services/api/usertracker';

import './index.sass';

interface ClaimWrapperProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}
const ClaimWrapper: FC<ClaimWrapperProps> = memo(
  ({ visible, onClose, onSubmit }) => {
    const [searchParams] = useSearchParams();
    const from = searchParams.get('from');
    const [step, setStep] = useState<number>(0);
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();

    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const rewards = useSelector((state: UserState) => state.rewards);
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const credList: CredTypeItemType[] = useMemo(() => {
      let credArr = Object.values(credentialsFromStore);
      credArr = credArr.sort(
        (a, b) => Number(a.getDataTime) - Number(b.getDataTime)
      );
      return credArr;
    }, [credentialsFromStore]);

    const [sourceList, sourceMap] = useAllSources();
    const hasSource = useMemo(() => {
      const exLen =
        (sourceMap.exSources && Object.keys(sourceMap.exSources).length) ?? 0;
      const kycLen =
        (sourceMap.kycSources && Object.keys(sourceMap.kycSources).length) ?? 0;
      const totalLen = exLen + kycLen;
      return totalLen > 0;
    }, [sourceMap]);
    const hasCred = useMemo(() => {
      return credList.length > 0;
    }, [credList]);
    
    const hadSendToChain = useMemo(() => {
      const hadFlag = credList.some(
        (item) => item?.provided?.length && item?.provided?.length > 0
      );
      return hadFlag;
    }, [credList]);
    const hasOnChainWebProof = useMemo(() => {
      const hadFlag = credList.some(
        (item) =>
          item.reqType === 'web' &&
          item?.provided?.length &&
          item?.provided?.length > 0
      );
      return hadFlag;
    }, [credList]);
    const errorDescEl = useMemo(
      () => (
        <>
          <p>Your wallet did not connect or refused to authorize.</p>
          <p>Please try again later.</p>
        </>
      ),
      []
    );

    const dispatch: Dispatch<any> = useDispatch();
    const navigate = useNavigate();

    // const onSubmitClaimDialog = useCallback(() => {
    //   if (!hasSource) {
    //     setActiveRequest({
    //       type: 'warn',
    //       title: 'No required data',
    //       desc: 'Please go to the Data page to add Assets and Identity data.',
    //     });
    //     setStep(2);
    //     return;
    //   }
    //   if (!hasCred) {
    //     setActiveRequest({
    //       type: 'warn',
    //       title: 'No proof is created',
    //       desc: 'Please go to the Proofs page to generate.',
    //     });
    //     setStep(2);
    //     return;
    //   }
    //   if (!hadSendToChain) {
    //     setActiveRequest({
    //       type: 'warn',
    //       title: 'No proof is submitted',
    //       desc: 'Please go to the Proofs page to submit to the blockchain.',
    //     });
    //     setStep(2);
    //     return;
    //   }
    //   // setActiveRequest({
    //   //   type: 'loading',
    //   //   title: 'Processing',
    //   //   desc: 'It may take a few seconds.',
    //   // });
    //   setStep(1.5);
    // }, [hasSource, hasCred]);
    const onSubmitClaimDialog = useCallback(async () => {
      // 1.if participated
      // 2.has on chain web proof
      // 2.has connect wallet;
      // 3.has web proof;
      // 4.web proof on chain add exchange data source
      const {mysteryBoxRewards} = await chrome.storage.local.get([
        'mysteryBoxRewards',
      ]);
      
      if (mysteryBoxRewards) {
        setStep(3);
      } else {
        navigate('/cred?from=badge');
      }
    }, [navigate]);

    const onSubmitActiveRequestDialog = useCallback(() => {
      if (!hasSource) {
        navigate('/datas');
        return;
      }
      if (!hasCred) {
        navigate('/cred');
        return;
      }
      if (!hadSendToChain) {
        navigate('/cred');
        return;
      }
      onSubmit();
    }, [onSubmit, hasSource, hasCred, navigate]);
    
    const handleBackConnectWallet = useCallback(() => {
      setStep(1);
    }, []);
    useEffect(() => {
      if (visible && !from) {
        setStep(1);
        setActiveRequest(undefined);
      }
      if (visible && from) {
        setStep(3);
        setActiveRequest(undefined);
      }
    }, [visible, from]);
    // useEffect(() => {
    //    chrome.storage.local.remove(['mysteryBoxRewards']);
    // })

    return (
      <div className="claimMysteryBoxWrapper">
        {visible && step === 1 && (
          <ClaimDialog onClose={onClose} onSubmit={onSubmitClaimDialog} />
        )}
        {/* {visible && step === 1.1 && (
          <TransferToChainDialog
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
            onClose={handleCloseMask}
            onSubmit={handleSubmitTransferToChain}
            onCancel={handleCancelTransferToChain}
          />
        )} */}
        {visible && step === 2 && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerEl={<ClaimDialogHeaderDialog />}
          />
        )}
        {visible && step === 3 && (
          <RewardsDialog onClose={onClose} onSubmit={onClose} />
        )}
      </div>
    );
  }
);
export default ClaimWrapper;
