import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import iconInfoRed from '@/assets/img/iconInfoRed.svg';
import PControledInput from '@/components/PControledInput';
import PCopy from '@/components/PCopy';
import PBack from '@/components/PBack';
import PMask from '@/components/PMask';

import { postMsg } from '@/utils/utils';
import type { UserState } from '@/types/store';

import './index.sass';

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ExportWallet: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit, onBack }) => {
    const [errorTipVisible, setErrorTipVisible] = useState<boolean>();
    const [pwdErrorTxt, setPwdErrorTxt] = useState<string>('');
    const [passphase, setPassphase] = useState<string>('');
    const [step, setStep] = useState<number>(1);
    const [privateKey, setPrivateKey] = useState<string>('');
    const [address, setAddress] = useState<string>();

    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );

    const formatAddr = useMemo(() => {
      return address ? '0x' + address : '';
    }, [address]);

    const getUserInfo = () => {
      chrome.storage.local.get(['keyStore'], ({ keyStore }) => {
        if (keyStore) {
          const parseKeystore = JSON.parse(keyStore);
          const { address } = parseKeystore;
          setAddress(address);
        }
      });
    };
    const handleChangePassphase = useCallback((val: string) => {
      setPassphase(val);
    }, []);
    const padoServicePortListener = useCallback(
      function (message: any) {
        if (message.resMethodName === 'decrypt') {
          console.log('page_get:decrypt:', 'exportWallet');
          if (message.res) {
            const { privateKey } = message.res;
            setPrivateKey(privateKey);
            setStep(2);
            
          } else {
            setPwdErrorTxt('Password error');
            // alert('Failed to decrypt wallet');
          }
          padoServicePort.onMessage.removeListener(padoServicePortListener);
        }
      },
      [padoServicePort.onMessage]
    );
    const decryptingKeyStore = useCallback(() => {
      padoServicePort.onMessage.addListener(padoServicePortListener);
      const msg = {
        fullScreenType: 'wallet',
        reqMethodName: `decrypt`,
        params: {
          password: passphase,
        },
      };
      postMsg(padoServicePort, msg);
    }, [padoServicePort, padoServicePortListener, passphase]);
    const handleClickNext = useCallback(() => {
      if (step === 1) {
        if (!passphase) {
          setErrorTipVisible(true);
          return;
        }
        decryptingKeyStore();
      } else if (step === 2) {
        onSubmit();
      }
    }, [passphase, decryptingKeyStore, step, onSubmit]);
    useEffect(() => {
      getUserInfo();
    }, []);
    useEffect(() => {
      if (passphase) {
        setErrorTipVisible(false);
      } else {
        setPwdErrorTxt('');
      }
    }, [passphase]);
    

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog exportWalletDialog">
          <PBack onBack={onBack} />
          <main>
            <h1>Backup Your Account</h1>
            <div className="infoWrapper">
              <div className="infoItem gray">
                <div className="label">Account</div>
                <div className="value">
                  <div className="left">{formatAddr}</div>
                  <PCopy text={formatAddr} />
                </div>
              </div>
              {step === 1 && (
                <div className="infoItem">
                  <div className="label">Private Key</div>
                  <div className="value">
                    <PControledInput
                      key="passPhase"
                      type="password"
                      placeholder="Please enter your password"
                      onChange={handleChangePassphase}
                      onSearch={handleClickNext}
                      value={passphase}
                      visible
                    />
                  </div>
                  {errorTipVisible && (
                    <p className="errorTip">Please enter your password</p>
                  )}
                  {pwdErrorTxt && <p className="errorTip">{pwdErrorTxt}</p>}
                </div>
              )}
              {step === 2 && (
                <>
                  <div className="infoItem gray privateKey">
                    <div className="label">Private key</div>
                    <div className="value">
                      <div className="left">{privateKey}</div>
                      <PCopy text={privateKey} />
                    </div>
                    <div className="tip">
                      <img src={iconInfoRed} alt="" />
                      <div className="txt">
                        Please don’t disclose your private key! If someone gets
                        your private key, they can steal any assets in your
                        account.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>{step === 2 ? 'OK' : 'Next'}</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default ExportWallet;
