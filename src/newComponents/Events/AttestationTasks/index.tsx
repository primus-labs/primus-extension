import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ATTESTATIONTYPEMAP } from '@/config/attestation';

import type { UserState } from '@/types/store';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';

import PMask from '@/newComponents/PMask';
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';
import iconCircleSuc from '@/assets/newImg/layout/iconCircleSuc.svg';
import AttestationTasksDialog from '../AttestationTasksDialog';
import './index.scss';

import {
  eventMetaMap,
  ETHSIGNEVENTNAME,
  EARLYBIRDNFTEVENTNAME,
} from '@/config/events';
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
    const eventMetaInfo = eventMetaMap[eventId];
    const socialTaskMap = {
      x: {
        id: '1',
        dataSourceId: 'x',
        title: 'Follow @primus_labs',
        subTitle: 'Authorize twitter and follow ',
      },
      discord: {
        id: '2',
        dataSourceId: 'discord',
        title: 'Join Primus Server',
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
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );

    const taskIds = useMemo(() => {
      let l: string[] = [];
      l = Object.keys(eventMetaInfo.taskMap.attestation);
      return l;
    }, []);
    const multipleTask = useMemo(() => {
      return taskIds.length > 1;
    }, [taskIds]);
    const handleCloseAssetDialog = useCallback(() => {
      setVisibleAssetDialog('');
      if (multipleTask) {
        setStep(1);
      } else {
        onSubmit();
      }
    }, [multipleTask, onSubmit]);

    const handleCloseAttestationTasksDialog = useCallback(() => {
      onSubmit();
    }, [onSubmit]);
    // const handleCloseAttestationTasksDialog = useCallback(() => {
    //   onSubmit();
    // }, [onSubmit]);
    const handleAttest = useCallback(
      (taskId) => {
        setStep(2);
        let attestationType,
          verificationContent,
          verificationValue,
          dataSourceId;
        if (eventId === ETHSIGNEVENTNAME) {
          attestationType = 'Social Connections';
        } else if (eventId === EARLYBIRDNFTEVENTNAME) {
          attestationType = 'Assets Verification';
        } else {
          attestationType = 'Humanity Verification';
        }

        const activeWebProofTemplate = webProofTypes.find(
          (i) => i.id === taskId
        );
        if (activeWebProofTemplate) {
          const { dataSource, name } = activeWebProofTemplate;
          dataSourceId = dataSource;
          if (name === 'KYC Status') {
            verificationContent = name;
            verificationValue = 'Basic Verification';
          } else if (name === 'Account Ownership') {
            verificationContent = 'Account ownership';
            verificationValue = 'Account owner';
          } else if (name === 'X Followers') {
            verificationContent = 'X Followers';
          }
        } else {
          if (taskId === '100') {
            dataSourceId = 'google';
            verificationContent = 'Account ownership';
            verificationValue = 'Account owner';
          } else if (taskId === 'Assets Verification') {
            dataSourceId = '';
            verificationContent = '';
            verificationValue = '';
          }
        }
        setVisibleAssetDialog(attestationType);
        if (!(taskId in ATTESTATIONTYPEMAP)) {
          const presetsP = {
            verificationContent,
            verificationValue,
            dataSourceId,
            // account: ''
          };
          setAttestationPresets(presetsP);
        }
      },
      [webProofTypes]
    );
    useEffect(() => {
      if (multipleTask) {
        setStep(1);
      } else {
        handleAttest(taskIds[0]);
      }
    }, [multipleTask]);

    return (
      <div className="attestationTasks">
        {multipleTask && step === 1 && (
          <AttestationTasksDialog
            onClose={handleCloseAttestationTasksDialog}
            onSubmit={handleCloseAttestationTasksDialog}
            onChange={handleAttest}
          />
        )}
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
