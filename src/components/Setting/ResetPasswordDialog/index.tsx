import React, { useState, useEffect, useMemo } from 'react';
import './index.sass';
import PMask from '@/components/PMask';
import SetPassword from '@/components/Setting/SetPassword';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}

const ResetPassword: React.FC<SetPwdDialogProps> = ({ onClose, onSubmit }) => {
  
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );

  const handleSubmit = (newPwd: string) => {
    const padoServicePortListener = function (message: any) {
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
  };

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog resetPwdDialog">
        <SetPassword
          title="Change Password"
          desc="Enter a new password to setup. You will need to log in again when settings are finished."
          onSubmit={handleSubmit}
        />
      </div>
    </PMask>
  );
};

export default ResetPassword;
