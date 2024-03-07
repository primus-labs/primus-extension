import React, { memo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import SetPwdForm from './SetPwdForm';

import './index.scss';

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  // onCancel: () => void;
}

type PswFormType = {
  password: '';
  confirmation: '';
};

const SettingSetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [accountAddr, setAccountAddr] = useState<any>();

    return (
      <PMask>
        {/* onClose={onClose} closeable={!fromEvents} */}
        <div className="pDialog2 setPwdDialog">
          <main>
            <header>
              <h1>Change Password</h1>
            </header>
            <PClose onClick={onClose}/>
            <section className="detailWrapper">
              <div className="step step1">
                <div className="con">
                  Set a new password for extension security and data protection. You will need to login again after
                  settlement.
                </div>
              </div>
            </section>
            <SetPwdForm onSubmit={onSubmit} />
          </main>
        </div>
      </PMask>
    );
  },
);

export default SettingSetPwdDialog;
