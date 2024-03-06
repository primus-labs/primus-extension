import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import { DATASOURCEMAP } from '@/config/dataSource';

import type { UserState } from '@/types/store';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';

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

    const taskIds = useMemo(() => {
      let l: string[] = [];
      if (eventId === LINEAEVENTNAME) {
        return (l = ['1']);
      } else if (eventId === BASEVENTNAME) {
        return [];
      }
      return l;
    }, [eventId]);
    const multipleTask = useMemo(() => {
      return taskIds.length > 1;
    }, [taskIds]);
    const handleCloseAssetDialog = useCallback(() => {
      setVisibleAssetDialog('');
    }, []);

    const handleCloseAttestationTasksDialog = useCallback(() => {
      onSubmit();
    }, [onSubmit]);
    const handleAttest = useCallback((taskId) => {
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
      debugger;
      setAttestationPresets(presetsP);
    }, []);
    useEffect(() => {
      if (!multipleTask) {
        handleAttest(taskIds[0]);
      }
    }, [multipleTask]);

    // useEffect(() => {
    //   if (attestLoading === 2) {
        // const res = await chrome.storage.local.get([eventId]);
        // const currentAddress = connectedWallet?.address;
        // if (res[eventId]) {
        //   const lastEventObj = JSON.parse(res[eventId]);
        //   const lastInfo = lastEventObj[currentAddress];
        //   if (lastInfo) {
        //     const { taskMap } = lastInfo;
        //     const statusM = Object.keys(taskMap).reduce((prev, curr) => {
        //       const currTask = taskMap[curr];
        //       // tasksProcess
        //       if (currTask) {
        //         const taskLen = Object.keys(currTask).length;
        //         const doneTaskLen = Object.values(currTask).filter(
        //           (i) => !!i
        //         ).length;
        //         const allDone = taskLen === doneTaskLen;

        //         stepMap[curr].tasksProcess.total = taskLen;
        //         stepMap[curr].tasksProcess.current = doneTaskLen;
        //         stepMap[curr].finished = allDone;

        //         prev[curr] = allDone ? 1 : 0;
        //       }
        //       return prev;
        //     }, {});
        //     setTaskStatusMap({ ...statusM });
        //   }
        // }
      // }
    // }, [attestLoading]);
    return (
      <div className="attestationTasks">
        {/* {multipleTask && step === 1 && (
          <AttestationTasksDialog
            onClose={handleCloseAttestationTasksDialog}
            onSubmit={handleCloseAttestationTasksDialog}
          />
        )} */}
        {visibleAssetDialog && (
          <CreateZkAttestation
            presets={attestationPresets}
            type={visibleAssetDialog}
            onClose={handleCloseAssetDialog}
            onSubmit={handleCloseAssetDialog}
          />
        )}
      </div>
    );
  }
);

export default SetPwdDialog;
