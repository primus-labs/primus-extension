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
import { ETHSIGNEVENTNAME } from '@/config/constants';
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
    const [BASEventDetail] = useEventDetail(ETHSIGNEVENTNAME);
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
      const res = await chrome.storage.local.get([ETHSIGNEVENTNAME]);
      if (res[ETHSIGNEVENTNAME]) {
        const lastInfo = JSON.parse(res[ETHSIGNEVENTNAME]);
        lastInfo.status = 1;
        await chrome.storage.local.set({
          [ETHSIGNEVENTNAME]: JSON.stringify(lastInfo),
        });
      }
      onSubmit();
      
    }, [onSubmit]);
    // }, [navigate, dispatch, onClose]);

    const onSubmitActiveRequestDialog = useCallback(() => {
      onSubmit();
    }, [onSubmit]);
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
        // if (lastEventObj[currentAddress]) {
        const joinAddressArr = Object.keys(lastEventObj);
        if (joinAddressArr.length > 0) {
          const { taskMap } = lastEventObj[joinAddressArr[0]];
          const finishTasksFlag = Object.values(taskMap).every(
            (taskObj: any) => {
              const currTaskFinishFlag = Object.values(taskObj).every(
                (t) => !!t
              );
              return currTaskFinishFlag;
            }
          );
          if (finishTasksFlag) {
            lastEventObj[currentAddress] = emptyInfo;
          }
          await chrome.storage.local.set({
            [eventId]: JSON.stringify(newEventObj),
          });
        }
        // } else {
        //   debugger;
        //   // have joined ,but not by current connected address
        //   newEventObj = { ...lastEventObj };
        //   newEventObj[currentAddress] = emptyInfo;
        // }
      } else {
        //  have not joined this event
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
    const handleAttest = useCallback(
      (attestationId) => {
        // setStep(1);
        onAttest(attestationId);
      },
      [onAttest]
    );
    useEffect(() => {
      if (visible && activeStep) {
        setStep(activeStep);
      }
    }, [activeStep, visible]);

    return (
      <div className="claimMysteryBoxWrapper">
        {visible && step === 1 && (
          <ClaimDialog
            onSubmit={onSubmitClaimDialog}
            onChange={onChangeFn}
            onClose={onClose}
            title="SignX Program"
            titleIllustration={true}
            subTitle=""
          />
        )}
        {visible && step === 1.5 && (
          <SocialTasksDialog
            onSubmit={handleCloseSocialTasksDialog}
            onClose={handleCloseSocialTasksDialog}
          />
        )}
        {visible && step === 2 && (
          <CredTypesDialog
            onSubmit={handleAttest}
            onClose={handleCloseSocialTasksDialog}
          />
        )}
      </div>
    );
  }
);
export default ClaimWrapper;
