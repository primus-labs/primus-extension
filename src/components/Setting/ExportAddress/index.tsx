import React, { useState, useEffect, useMemo } from 'react';
import './index.sass';
import PMask from '@/components/PMask';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';
import iconCopy from '@/assets/img/iconCopy.svg'
import iconInfoRed from '@/assets/img/iconInfoRed.svg';
import PControledInput from '@/components/PControledInput';


interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}

const ExportAddress: React.FC<SetPwdDialogProps> = ({ onClose, onSubmit }) => {
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const [passphase, setPassphase] = useState<string>();
  const [step, setStep] = useState<number>(1)
  const handleChangePassphase = (val: string) => {
    setPassphase(val);
  };
  const handleClickNext = () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      onSubmit()
    }
  }

 

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog exportAddressDialog">
        <main>
          <h1>Back up on-chain address</h1>
          <div className="infoWrapper">
            <div className="infoItem">
              <div className="label">On-chain address</div>
              <div className="value">
                <div className="left">
                  0xced6324caa3bf9df5ce0bc67146b7a9e7657fFb1
                </div>
                <img className="right" src={iconCopy} alt="" />
              </div>
            </div>
            {step === 1 && (
              <div className="infoItem">
                <div className="label">Enter your password to export</div>
                <div className="value">
                  <PControledInput
                    key="passPhase"
                    type="password"
                    placeholder="Please enter your Passphase"
                    onChange={handleChangePassphase}
                    value={passphase}
                    visible
                  />
                </div>
              </div>
            )}
            {step === 2 && (
              <>
                <div className="infoItem">
                  <div className="label">Private key</div>
                  <div className="value">
                    <div className="left">
                      xxxxxxxxxxxxxxxsssssssssssswwwwwwwwweeeeeeeeeeerrrrrrrrrrttttttttttyyyyyy
                    </div>
                    <img className="right" src={iconCopy} alt="" />
                  </div>
                </div>
                <div className="errorTipWrapper">
                  <img src={iconInfoRed} alt="" />
                  <div className="txt">
                    Please don’t disclose your private key! If someone gets your
                    private key, they can steal any assets in your account.
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          <span>Next</span>
        </button>
      </div>
    </PMask>
  );
};

export default ExportAddress;
