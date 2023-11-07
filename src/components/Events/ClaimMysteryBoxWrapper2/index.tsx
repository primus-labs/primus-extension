import React, {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
// import ClaimDialog from './ClaimDialog';
import ClaimDialog from '@/components/Events/ClaimWrapper/ClaimDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';

import {
  ONCHAINLIST,
  PADOADDRESS,
  EASInfo,
  CLAIMNFTNETWORKNAME,
} from '@/config/envConstants';
import { connectWallet } from '@/services/wallets/metamask';
import { mintWithSignature } from '@/services/chains/erc721';
import { getEventSignature, getNFTInfo } from '@/services/api/event';
import {
  initRewardsActionAsync,
  setRewardsDialogVisibleAction,
} from '@/store/actions';
import { getAuthUserIdHash } from '@/utils/utils';
import useAllSources from '@/hooks/useAllSources';
import type { WALLETITEMTYPE } from '@/types/config';
import type { ActiveRequestType } from '@/types/config';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';
import type { Dispatch } from 'react';
import { eventReport } from '@/services/api/usertracker';

import '@/components/Events/ClaimWrapper/index.scss';
dayjs.extend(utc);
interface ClaimWrapperProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}
const ClaimWrapper: FC<ClaimWrapperProps> = memo(
  ({ visible, onClose, onSubmit }) => {
    const [searchParams] = useSearchParams();
    const BadgesProcess = searchParams.get('BadgesProcess');
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

    const onSubmitClaimDialog = useCallback(async () => {
      // 1.if participated
      // 2.has on chain web proof
      // 2.has connect wallet;
      // 3.has web proof;
      // 4.web proof on chain add exchange data source
      const { mysteryBoxRewards } = await chrome.storage.local.get([
        'mysteryBoxRewards',
      ]);
      if (mysteryBoxRewards) {
        dispatch(
          setRewardsDialogVisibleAction({
            visible: true,
            tab: 'Badges',
          })
        );
        onClose();
      } else {
        navigate('/cred?fromEvents=Badges');
      }
    }, [navigate, dispatch, onClose]);

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
      if (visible) {
        setStep(1);
        setActiveRequest(undefined);
        if (BadgesProcess === 'error') {
          setStep(2);
          setActiveRequest({
            type: 'error',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        }
      }
    }, [BadgesProcess, errorDescEl, visible]);
    // useEffect(() => {
    //    chrome.storage.local.remove(['mysteryBoxRewards']);
    // })
    const ruleItems = [
      'Create an attestation to confirm your humanity through your exchange accounts‘.',
      'Submit your attestation to Linea mainnet',
    ];
    const descItem = (
      <>
        You will have a mystery box after completing the event. (
        <span>Each user can only claim one</span>)
      </>
    );
    const badgeEventPeriod = useSelector(
      (state: UserState) => state.badgeEventPeriod
    );
    const endStamp = useMemo(() => {
      const { startTime, endTime } = badgeEventPeriod;
      return +endTime;
    }, [badgeEventPeriod]);
    const formatEndTime = useMemo(() => {
      if (endStamp) {
        dayjs.utc();
        const s = dayjs.utc(endStamp).format('DD-MMM-h-a');
        const arr = s.split('-');
        return arr;
      }
    }, [endStamp]);
    const extraEl = useMemo(() => {
      return (
        <>
          The rewards will be announced in{' '}
          <b>
            {formatEndTime[0]}th {formatEndTime[1]} ({formatEndTime[2]}
            {formatEndTime[3]} UTC time)
          </b>
          and you will find your lucky badge in the Rewards menu.
        </>
      );
    }, [formatEndTime]);

    return (
      <div className="claimMysteryBoxWrapper">
        {visible && step === 1 && (
          <ClaimDialog
            onClose={onClose}
            onSubmit={onSubmitClaimDialog}
            title="Linea Campaign"
            titleIllustration={true}
            subTitle="Complete the following tasks to submit an entry to this campaign."
            rules={ruleItems}
            desc={descItem}
            extra={extraEl}
          />
        )}
        {visible && step === 2 && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerEl={
              <ClaimDialogHeaderDialog
                title="Product Officially Launch"
                illustration={true}
              />
            }
          />
        )}
      </div>
    );
  }
);
export default ClaimWrapper;
