import React, {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import ClaimDialog from './ClaimDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';

import useAllSources from '@/hooks/useAllSources';
import { ONCHAINLIST, PADOADDRESS, EASInfo } from '@/config/envConstants';
import { connectWallet } from '@/services/wallets/metamask';
import { mintWithSignature } from '@/services/chains/erc721';
import { getEventSignature, getNFTInfo } from '@/services/api/event';
import { initRewardsActionAsync } from '@/store/actions';
import { getAuthUserIdHash } from '@/utils/utils';

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
    const [step, setStep] = useState<number>(0);
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();

    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
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

    const onSubmitClaimDialog = useCallback(() => {
      if (!hasSource) {
        setActiveRequest({
          type: 'warn',
          title: 'No required data',
          desc: 'Please go to the Data page to add Assets and Identity data.',
        });
        setStep(2);
        return;
      }
      if (!hasCred) {
        setActiveRequest({
          type: 'warn',
          title: 'No proof is created',
          desc: 'Please go to the Credential page to generate.',
        });
        setStep(2);
        return;
      }
      // setActiveRequest({
      //   type: 'loading',
      //   title: 'Processing',
      //   desc: 'It may take a few seconds.',
      // });
      setStep(1.5);
    }, [hasSource, hasCred]);

    const onSubmitActiveRequestDialog = useCallback(() => {
      if (!hasSource) {
        navigate('/datas');
        return;
      }
      if (!hasCred) {
        navigate('/cred');
        return;
      }
      onSubmit();
    }, [onSubmit, hasSource, hasCred, navigate]);
    useEffect(() => {
      if (visible) {
        setStep(1);
        setActiveRequest(undefined);
      }
    }, [visible]);
    const handleBackConnectWallet = useCallback(() => {
      setStep(1);
    }, []);
    const handleSubmitConnectWallet = useCallback(
      async (wallet: WALLETITEMTYPE) => {
        // setActiveRequest({
        //   type: 'loading',
        //   title: 'Processing',
        //   desc: 'It may take a few seconds.',
        // });
        setActiveRequest({
          type: 'loading',
          title: 'Processing',
          desc: 'Please complete the transaction in your wallet.',
        });
        setStep(2);
        let eventSingnature = '';
        try {
          const activeCred = credList[credList.length - 1];
          const requestParams: any = {
            rawParam: activeCred,
            greaterThanBaseValue: true,
            signature: activeCred.signature,
          };
          if (activeCred.type === 'IDENTIFICATION_PROOF') {
            const authUseridHash = await getAuthUserIdHash();
            const { source, type } = activeCred;
            requestParams.dataToBeSigned = {
              source: source,
              type: type,
              authUseridHash: authUseridHash,
              recipient: walletAddress,
              timestamp: +new Date() + '',
              result: true,
            };
          }
          const { rc, result } = await getEventSignature(requestParams);
          if (rc === 0) {
            eventSingnature = result.signature;
          }
        } catch {
          alert('getEventSignature network error!');
        }

        const activeNetworkName = 'Polygon';
        const targetNetwork =
          EASInfo[activeNetworkName as keyof typeof EASInfo];
        try {
          const [accounts, chainId, provider] = await connectWallet(
            targetNetwork
          );
          const { keyStore } = await chrome.storage.local.get(['keyStore']);
          const { address } = JSON.parse(keyStore);
          const upChainParams = {
            networkName: activeNetworkName,
            metamaskprovider: provider,
            receipt: '0x' + address,
            signature: '0x' + eventSingnature, // TODO
          };
          const mintRes = await mintWithSignature(upChainParams);
          const nftInfo = await getNFTInfo(mintRes[1]);
          const newRewards = { ...rewards };
          newRewards[mintRes[0]] = { ...nftInfo, tokenId: mintRes[0] };
          await chrome.storage.local.set({
            rewards: JSON.stringify(newRewards),
          });
          await dispatch(initRewardsActionAsync());
          setActiveRequest({
            type: 'suc',
            title: 'Congratulations',
            desc: 'Successfully get your rewards.',
          });

          const eventInfo = {
            eventType: 'EVENTS',
            rawData: {name: 'Get on-boarding reward', issuer: 'PADO'},
          };
          eventReport(eventInfo);
        } catch (e) {
          console.log('mintWithSignature error:', e);
          setActiveRequest({
            type: 'error',
            title: 'Failed',
            desc: errorDescEl,
          });
        }
      },
      [credList, rewards, dispatch, walletAddress, errorDescEl]
    );

    return (
      <div className="claimWrapper">
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
        {visible && step === 1.5 && (
          <ConnectWalletDialog
            onClose={onClose}
            onSubmit={handleSubmitConnectWallet}
            onBack={handleBackConnectWallet}
          />
        )}
        {visible && step === 2 && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerType="claim"
          />
        )}
      </div>
    );
  }
);
export default ClaimWrapper;
