import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveOnChain } from '@/store/actions';

import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import { DATASOURCEMAP } from '@/config/dataSource';
import { EASInfo } from '@/config/chain';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';
import SubmitOnChain from '@/newComponents/ZkAttestation/SubmitOnChain';

import PMask from '@/newComponents/PMask';
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';
import iconCircleSuc from '@/assets/newImg/layout/iconCircleSuc.svg';
import AttestationTasksDialog from '../AttestationTasksDialog';
import './index.scss';

import { LINEAEVENTNAME, BASEVENTNAME } from '@/config/events';
interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}
type TaskStatusMap = {
  x: number;
  discord: number;
};
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('id') as string;
    const socialTaskMap = {
      x: {
        id: '1',
        dataSourceId: 'x',
        title: 'Follow @padolabs',
        subTitle: 'Authorize twitter and follow ',
      },
      discord: {
        id: '2',
        dataSourceId: 'discord',
        title: 'Join PADO Server',
        subTitle: 'Authorize discord and join',
      },
    };
    const [visibleTasksDialog, setVisibleTasksDialog] =
      useState<boolean>(false);
    const [step, setStep] = useState<number>(1);
    const [xTabId, setXTabId] = useState<number>();
    const [PADOTabId, setPADOTabId] = useState<number>();
    const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
    const [attestationPresets, setAttestationPresets] = useState<any>();
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const activeOnChain = useSelector(
      (state: UserState) => state.activeOnChain
    );

    const taskIds = useMemo(() => {
      let l: string[] = [];
      if (eventId === LINEAEVENTNAME) {
        return (l = ['Linea Goerli']);
      } else if (eventId === BASEVENTNAME) {
        return [];
      }
      return l;
    }, [eventId]);
    const multipleTask = useMemo(() => {
      return taskIds.length > 1;
    }, [taskIds]);
    const formatList = useMemo(() => {
      let l = taskIds.map((i) => {
        const { title, showName, icon, disabled } = EASInfo[i];
        return {
          id: title,
          name: showName,
          icon,
          disabled,
        };
      });
      return l;
    }, [taskIds]);
    const handleSubmitOnChainDialog = useCallback(() => {
      // setVisibleOnChainDialog(false);
      dispatch(setActiveOnChain({ loading: 0 }));
    }, [dispatch]);
    const handleCloseAssetDialog = useCallback(() => {
      setVisibleAssetDialog('');
      multipleTask && onSubmit();
    }, [multipleTask, onSubmit]);

    const handleCloseAttestationTasksDialog = useCallback(() => {
      onSubmit();
    }, [onSubmit]);
    const handleSubTask = useCallback((taskId) => {
      let attestationType, verificationContent, verificationValue, dataSourceId;
      if (taskId === '1') {
        attestationType = 'Humanity Verification';
        verificationContent = 'KYC Status';
        verificationValue = 'Basic Verification';
        dataSourceId = 'binance';
      }
      setVisibleAssetDialog(attestationType);
      const presetsP = {
        verificationContent,
        verificationValue,
        dataSourceId,
        // account: ''
      };
      setAttestationPresets(presetsP);
    }, []);
    useEffect(() => {
      dispatch(setActiveOnChain({ loading: 1 }));
    }, [dispatch]);
    return (
      <div className="onChainTasks">
        {/* {multipleTask && step === 1 && (
          <AttestationTasksDialog
            onClose={handleCloseAttestationTasksDialog}
            onSubmit={handleCloseAttestationTasksDialog}
          />
        )} */}
        {activeOnChain.loading === 1 && (
          <SubmitOnChain
            list={formatList}
            onClose={handleSubmitOnChainDialog}
            onSubmit={handleSubmitOnChainDialog}
          />
        )}
      </div>
    );
  }
);

export default SetPwdDialog;
