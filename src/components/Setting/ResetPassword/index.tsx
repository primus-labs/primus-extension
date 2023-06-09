import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react';
import './index.sass';
import PMask from '@/components/PMask';
import SetPassword from '@/components/Setting/SetPassword';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: (pwd: string) => void;
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = ({ onClose, onSubmit }) => {
  const dispatch: Dispatch<any> = useDispatch();

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );

  const initAccount = () => {
    const padoServicePortListener = function (message: any) {
      if (message.resMethodName === 'resetPassword') {
        console.log('page_get:resetPassword:', message.res);
        if (message.res) {
        }
      }
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);

    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'resetPassword',
      params: {
        // TODO
      },
    };
    postMsg(padoServicePort, msg);
    console.log('page_send:resetPassword');
  };

  useEffect(() => {
    // initAccount();
  }, []);

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog resetPwdDialog">
        <SetPassword
          title="Change Password"
          desc="Enter a new password to setup. You will need to log in again when settings are finished."
          onSubmit={onSubmit}
        />
      </div>
    </PMask>
  );
};

export default SetPwdDialog;
