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
import SocialTasksDialog from './SocialTasksDialog';
import useAllSources from '@/hooks/useAllSources';
import { BASEVENTNAME, ETHSIGNEVENTNAME } from '@/config/constants';
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
    const [visibleSocialTasksDialog, setVisibleSocialTasksDialog] =
      useState<boolean>(false);
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
      const isUnStart = dayjs().isBefore(dayjs(+startTime));
      const isActive =
        dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
      const isEnd = dayjs().isAfter(dayjs(+endTime));
      const isLongTerm = BASEventDetail?.ext?.isLongTermEvent;
      if (isUnStart) {
        return 0;
      }
      if (isActive) {
        return 1;
      }
      if (isEnd && !isLongTerm) {
        return 2;
      }
      if (isLongTerm) {
        return 3;
      }
      return 0;
    }, [BASEventPeriod, BASEventDetail?.ext?.isLongTermEvent]);

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
      } else if (eventActiveFlag === 3) {
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
        if (itemId === 2) {
          setStep(1.5);
        } else if (itemId === 3) {
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
    const handleCloseSocialTasksDialog = useCallback(() => {
      setStep(1);
    }, []);
    useEffect(() => {
      if (visible && activeStep) {
        setStep(activeStep);
      }
    }, [activeStep, visible]);
    const initEvent = useCallback(async () => {
      let newEventObj = {};
      const currentAddress = connectedWallet?.address;
      const eventId = ETHSIGNEVENTNAME;
      const res = await chrome.storage.local.get([eventId]);
      let emptyInfo = {};
      let attestation = {};
      if (eventId === ETHSIGNEVENTNAME) {
        attestation = {
          '1000': 0,
        };
      }
      emptyInfo = {
        address: currentAddress,
        taskMap: {
          follow: {
            x: 0,
            discord: 0,
          },
          attestation,
          onChain: {
            onChain: 0,
          },
          check: {
            check: 1,
          },
        },
      };

      // have joined this event
      if (res[eventId]) {
        const lastEventObj = JSON.parse(res[eventId]);
        // have joined this event by current connected address
        if (lastEventObj[currentAddress]) {
          const { taskMap } = lastEventObj[currentAddress];
          const finishTasksFlag = Object.values(taskMap).every((taskObj: any) => {
            const currTaskFinishFlag = Object.values(taskObj).every((t) => !!t);
            return currTaskFinishFlag;
          });
          debugger
          if (finishTasksFlag) {
            lastEventObj[currentAddress] = emptyInfo;
          }
        } else {
          debugger;
          // have joined ,but not by current connected address
          newEventObj = { ...lastEventObj };
          newEventObj[currentAddress] = emptyInfo;
        }
        await chrome.storage.local.set({
          [eventId]: JSON.stringify(newEventObj),
        });
      } else {
        //  have not joined this event
        debugger
        newEventObj = {
          [currentAddress]: emptyInfo,
        };
        await chrome.storage.local.set({
          [eventId]: JSON.stringify(newEventObj),
        });
      }
    }, [connectedWallet?.address]);
    useEffect(() => {
      if (visible) {
        initEvent();
      }
    }, [visible, initEvent]);
    return (
      <div className="claimMysteryBoxWrapper">
        {visible && step === 1 && (
          <ClaimDialog
            onClose={onClose}
            onSubmit={onSubmitClaimDialog}
            onChange={onChangeFn}
            title="SignX Program"
            titleIllustration={true}
            subTitle=""
          />
        )}
        {visible && step === 1.5 && (
          <SocialTasksDialog
            onClose={handleCloseSocialTasksDialog}
            onSubmit={handleCloseSocialTasksDialog}
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
