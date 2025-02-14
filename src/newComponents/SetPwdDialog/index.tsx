import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
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

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    return (
      <PMask>
        {/* onClose={onClose} closeable={!fromEvents} */}
        <div className="pDialog2 setPwdDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Connect by API</h1>
            </header>
            <section className="detailWrapper">
              <div className="step step1">
                <div className="tit">
                  <div className="order">1</div>
                  <span>Set up password</span>
                </div>
                <div className="con">
                  You need to set a password for extension security and data
                  protection.
                </div>
              </div>
              {/* <div className="step step1 done">
                <img className="iconDone" src={iconDone} alt="" />
                <div className="txt">Set up password</div>
              </div>
              <div className="step step2">
                <div className="tit">
                  <div className="order">2</div>
                  <span>Access your data</span>
                </div>
                <div className="con">
                  Configure with your READ-ONLY API keys
                </div>
              </div> */}
            </section>
            <SetPwdForm onSubmit={onSubmit} />
          </main>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
