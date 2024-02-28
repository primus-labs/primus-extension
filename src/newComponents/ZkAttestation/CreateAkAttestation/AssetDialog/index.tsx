import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import SetDataSource from '../SetDataSource';
import OrderItem from '@/newComponents/OrderItem'
import iconDone from '@/assets/newImg/layout/iconDone.svg';
import type { UserState } from '@/types/store';
import './index.scss';

interface PButtonProps {
  // sourceName: string;
  onClose: () => void;
  onSubmit: () => void;
}

const Nav: React.FC<PButtonProps> = memo(
  ({ onClose, onSubmit }) => {
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

   
    useEffect(() => {
      setStep(lastLoginHasPwd ? 3 : 1);
    }, []);

    return (
      <PMask>
        {/* onClose={onClose} closeable={!fromEvents} */}
        <div className="pDialog2 assetAttestationDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Create zkAttestation</h1>
              <h2>You're creating assets certification.</h2>
            </header>
            {step === 1 && (
              <section className="detailWrapper">
                <div className="step step1">
                  <OrderItem order="1" text="Choose data source" />
                </div>
              </section>
            )}
            {/* {step === 2 && (
              <section className="detailWrapper">
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
              </section>
            )} */}
            {step === 1 && (
              <SetDataSource onSubmit={handleSubmitSetPwdDialog} />
            )}
          </main>
        </div>
      </PMask>
    );
  }
);

export default Nav;
