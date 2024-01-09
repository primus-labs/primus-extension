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
import ClaimDialog from './ClaimDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import CredTypesDialog from './CredTypesDialog';
import useAllSources from '@/hooks/useAllSources';
import { BASEVENTNAME } from '@/config/constants';
import type { ActiveRequestType } from '@/types/config';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';
import type { Dispatch } from 'react';

import '@/components/Events/ClaimWrapper/index.scss';
dayjs.extend(utc);
interface ClaimWrapperProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (step: number) => void;
  onAttest: (attestId: string) => void;
}
const ClaimWrapper: FC<ClaimWrapperProps> = memo(
  ({ visible, onClose, onSubmit, onChange, onAttest }) => {
    const [searchParams] = useSearchParams();
    const BadgesProcess = searchParams.get('ScrollProcess');
    const [step, setStep] = useState<number>(0);
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const credList: CredTypeItemType[] = useMemo(() => {
      let credArr: CredTypeItemType[] = Object.values(credentialsFromStore);
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
      // const { mysteryBoxRewards } = await chrome.storage.local.get([
      //   'mysteryBoxRewards',
      // ]);
      // if (mysteryBoxRewards) {
      //   dispatch(
      //     setRewardsDialogVisibleAction({
      //       visible: true,
      //       tab: 'Badges',
      //     })
      //   );
      //   onClose();
      // } else {
      // navigate('/cred?fromEvents=Scroll');
      // }
    }, []);
    // }, [navigate, dispatch, onClose]);

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

    useEffect(() => {
      if (visible) {
        setStep(1);
        setActiveRequest(undefined);
        if (BadgesProcess === 'error') {
          setStep(2);
          setActiveRequest({
            type: 'warn',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        }
      }
    }, [BadgesProcess, errorDescEl, visible]);

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
    const onChangeFn = useCallback(
      (itemId) => {
        if (itemId === 3) {
          setStep(2);
        } else {
          onChange(itemId);
        }
      },
      [onChange]
    );
    const onCredTypesDialogBack = useCallback(() => {
      setStep(1);
    }, []);
    const onCredTypeDialogSubmit = useCallback(async () => {
      const res = await chrome.storage.local.get([BASEVENTNAME]);
      if (res[BASEVENTNAME]) {
        const lastInfo = JSON.parse(res[BASEVENTNAME]);
        lastInfo.steps[1].status = 1;
        await chrome.storage.local.set({
          [BASEVENTNAME]: JSON.stringify(lastInfo),
        });
      }
      setStep(1);
    }, []);

    return (
      <div className="claimMysteryBoxWrapper">
        {visible && step === 1 && (
          <ClaimDialog
            onClose={onClose}
            onSubmit={onSubmitClaimDialog}
            onChange={onChangeFn}
            title="Scroll zkAttestation Tasks"
            titleIllustration={true}
            subTitle=""
          />
        )}
        {visible && step === 2 && (
          <CredTypesDialog
            onClose={onClose}
            onSubmit={onCredTypeDialogSubmit}
            onChange={onAttest}
            onBack={onCredTypesDialogBack}
          />
        )}
        {visible && step === 3 && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerEl={
              <ClaimDialogHeaderDialog
                title="BAS zkAttestation Tasks"
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
