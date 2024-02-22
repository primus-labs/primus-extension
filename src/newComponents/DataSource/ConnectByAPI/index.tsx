import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import SetPwd from '@/newComponents/SetPwdDialog/SetPwdForm';
import SetAPI from '@/newComponents/SetAPIDialog/SetAPIForm';

import iconDone from '@/assets/newImg/layout/iconDone.svg';
import './index.scss';

interface PButtonProps {
  sourceName: string;
  onClose: () => void;
  onSubmit: () => void;
}

const Nav: React.FC<PButtonProps> = memo(
  ({ onClose, onSubmit, sourceName }) => {
    const [step, setStep] = useState<number>(1);
    const [hadSetPwd, setHadSetPwd] = useState<boolean>(false);

    const handleCloseSetPwdDialog = useCallback(() => {
      debugger;
      onClose();
    }, []);
    const handleSubmitSetPwdDialog = useCallback(() => {
      // onSubmit();
      debugger;
      setStep(2);
    }, []);
    const handleSubmitSetAPIDialog = useCallback(() => {
      onClose();
    }, []);

    const checkIfHadSetPwd = async () => {
      let { keyStore } = await chrome.storage.local.get(['keyStore']);
      setHadSetPwd(!!keyStore);
    };
    useEffect(() => {
      checkIfHadSetPwd();
    }, []);
    useEffect(() => {
      setStep(hadSetPwd ? 2 : 1);
    }, [hadSetPwd]);

    return (
      <PMask>
        {/* onClose={onClose} closeable={!fromEvents} */}
        <div className="pDialog2 connectByAPIDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Connect by API</h1>
            </header>
            <section className="detailWrapper">
              {step === 1 && (
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
              )}
              {step === 2 && (
                <>
                  <div className="step step1 done">
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
                  </div>
                </>
              )}
            </section>
            {step === 1 && <SetPwd onSubmit={handleSubmitSetPwdDialog} />}
            {step === 2 && (
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
