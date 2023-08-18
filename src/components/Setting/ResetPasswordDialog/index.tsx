import React, { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import PMask from '@/components/PMask';
import SetPassword from './SetPassword';
import PBack from '@/components/PBack';

import { postMsg } from '@/utils/utils';

import type { UserState } from '@/types/store';

import './index.sass';

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ResetPassword: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit, onBack }) => {
    // console.log('ResetPassword');

    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );

    const handleSubmit = useCallback(
      (newPwd: string) => {
        const padoServicePortListener = async function (message: any) {
          if (message.resMethodName === 'resetPassword') {
            console.log('page_get:resetPassword:', message.res);
            if (message.res) {
              onSubmit();
            } else {
              alert('Password reset failed');
            }
            padoServicePort.onMessage.removeListener(padoServicePortListener);
          }
        };
        padoServicePort.onMessage.addListener(padoServicePortListener);
        const msg = {
          fullScreenType: 'wallet',
          reqMethodName: 'resetPassword',
          params: {
            password: newPwd,
          },
        };
        postMsg(padoServicePort, msg);
        console.log('page_send:resetPassword');
      },
      [onSubmit, padoServicePort]
    );

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog resetPwdDialog">
          <PBack onBack={onBack} />
          <SetPassword
            title="Change Password"
            desc="Enter a new password to setup. You will need to log in again when settings are finished."
            onSubmit={handleSubmit}
            btnText="Next"
          />
        </div>
      </PMask>
    );
  }
);

export default ResetPassword;
