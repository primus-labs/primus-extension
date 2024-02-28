import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import SetPwd from '@/newComponents/SetPwdDialog/SetPwdForm';
import SetAPI from '@/newComponents/SetAPIDialog/SetAPIForm';
import OrderItem from '@/newComponents/OrderItem'
import iconDone from '@/assets/newImg/layout/iconDone.svg';
import type { UserState } from '@/types/store';
import './index.scss';

interface PButtonProps {
  sourceName: string;
  onClose: () => void;
  onSubmit: () => void;
}

const Nav: React.FC<PButtonProps> = memo(
  ({ onClose, onSubmit, sourceName }) => {
    const [step, setStep] = useState<number>(1);
    // const [hadSetPwd, setHadSetPwd] = useState<boolean>(false);
    const lastLoginHasPwd = useSelector(
      (state: UserState) => state.lastLoginHasPwd
    );
    
    const handleSubmitSetPwdDialog = useCallback(() => {
      // onSubmit();
      setStep(2);
    }, []);
    const handleSubmitSetAPIDialog = useCallback(() => {
      onClose();
    }, []);

    // const checkIfHadSetPwd = async () => {
    //   let { keyStore } = await chrome.storage.local.get(['keyStore']);
    //   setHadSetPwd(!!keyStore);
    // };
    // useEffect(() => {
    //   checkIfHadSetPwd();
    // }, []);
    useEffect(() => {
      setStep(lastLoginHasPwd ? 3 : 1);
    }, []);

    return (
      <PMask>
        {/* onClose={onClose} closeable={!fromEvents} */}
        <div className="pDialog2 connectByAPIDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Connect by API</h1>
              {step === 3 && <h2>Configure with your READ-ONLY API keys</h2>}
            </header>

            {step === 1 && (
              <section className="detailWrapper">
                <div className="step step1">
                  <OrderItem order="1" text="Set up password" />
                  <div className="con">
                    You need to set a password for extension security and data
                    protection.
                  </div>
                </div>
              </section>
            )}
            {step === 2 && (
              <section className="detailWrapper">
                <div className="step step1 done">
                  <img className="iconDone" src={iconDone} alt="" />
                  <div className="txt">Set up password</div>
                </div>
                <div className="step step2">
                  <OrderItem order="2" text="Access your data" />
                  <div className="con">
                    Configure with your READ-ONLY API keys
                  </div>
                </div>
              </section>
            )}
            {step === 1 && <SetPwd onSubmit={handleSubmitSetPwdDialog} />}
            {step > 1 && (
              <SetAPI
                onSubmit={handleSubmitSetAPIDialog}
                sourceName={sourceName}
              />
            )}
          </main>
        </div>
      </PMask>
    );
  }
);

export default Nav;
