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
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
// import ClaimDialog from './ClaimDialog';
import ClaimDialog from './ClaimDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import CredTypesDialog from './CredTypesDialog';
import useAllSources from '@/hooks/useAllSources';
import { BASEVENTNAME } from '@/config/constants';
import { queryEventDetail } from '@/services/api/event';
import useEventDetail from '@/hooks/useEventDetail';

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
  activeStep: number;
}
const ClaimWrapper: FC<ClaimWrapperProps> = memo(
  ({ visible, onClose, onSubmit, onChange, onAttest, activeStep }) => {
    const [BASEventDetail] = useEventDetail(BASEVENTNAME);
    const [searchParams] = useSearchParams();
    const BadgesProcess = searchParams.get('ScrollProcess');
    const [step, setStep] = useState<number>(0);
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
    const BASEventPeriod = useMemo(() => {
      if (BASEventDetail?.startTime) {
        const { startTime, endTime } = BASEventDetail;
        return {
          startTime,
          endTime,
        };
      } else {
        return {};
      }
    }, [BASEventDetail]);
    const eventActiveFlag = useMemo(() => {
      const { startTime, endTime } = BASEventPeriod;
      const isActive =
        dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
      const isEnd = dayjs().isAfter(dayjs(+endTime));
      if (isActive) {
        return 1;
      }
      if (isEnd) {
        return 2;
      }
      return 0;
    }, [BASEventPeriod]);

    const errorDescEl = useMemo(
      () => (
        <>
          <p>Your wallet did not connect or refused to authorize.</p>
          <p>Please try again later.</p>
        </>
      ),
      []
    );
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const resultDialogHeaderEl = useMemo(() => {
      let formatAddress = connectedWallet?.address;
      return <AddressInfoHeader address={formatAddress as string} />;
    }, [connectedWallet?.address]);
    const onSubmitClaimDialog = useCallback(async () => {
      const res = await chrome.storage.local.get([BASEVENTNAME]);
      if (res[BASEVENTNAME]) {
        const lastInfo = JSON.parse(res[BASEVENTNAME]);
        lastInfo.status = 1;
        await chrome.storage.local.set({
          [BASEVENTNAME]: JSON.stringify(lastInfo),
        });
      }
      if (eventActiveFlag === 1) {
        onSubmit();
      } else {
        setStep(3);
        setActiveRequest({
          type: 'suc',
          title: 'Congratulations',
          desc: 'Tasks finished！',
        });
      }
    }, [onSubmit, eventActiveFlag]);
    // }, [navigate, dispatch, onClose]);

    const onSubmitActiveRequestDialog = useCallback(() => {
      onSubmit();
    }, [onSubmit]);

    useEffect(() => {
      if (visible) {
        setStep(1);
        setActiveRequest(undefined);
      }
    }, [BadgesProcess, errorDescEl, visible]);

    const onChangeFn = useCallback(
      (itemId) => {
        // itemId: 3/4
        if (itemId === 3) {
          setStep(2);
        } else {
          //  (itemId === 4)
          onChange(itemId);
        }
      },
      [onChange]
    );
    const onCredTypeDialogSubmit = useCallback(async () => {
      setStep(1);
    }, []);
    useEffect(() => {
      if (visible && activeStep === 2) {
        setStep(2);
      }
    }, [activeStep, visible]);

    return (
      <div className="claimMysteryBoxWrapper">
        {visible && step === 1 && (
          <ClaimDialog
            onClose={onClose}
            onSubmit={onSubmitClaimDialog}
            onChange={onChangeFn}
            title="BNBChain Attestation Tasks "
            titleIllustration={true}
            subTitle=""
          />
        )}
        {visible && step === 2 && (
          <CredTypesDialog
            onClose={onClose}
            onSubmit={onCredTypeDialogSubmit}
            onChange={onAttest}
            onBack={onCredTypeDialogSubmit}
          />
        )}
        {visible && step === 3 && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerEl={resultDialogHeaderEl}
          />
        )}
      </div>
    );
  }
);
export default ClaimWrapper;
