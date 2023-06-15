import React, { useState, useEffect, useMemo } from 'react';
import './index.sass';
import PMask from '@/components/PMask';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import iconInfoRed from '@/assets/img/iconInfoRed.svg';
import PControledInput from '@/components/PControledInput';
import PCopy from '@/components/PCopy';
import PBack from '@/components/PBack';
import { postMsg } from '@/utils/utils';

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ExportWallet: React.FC<SetPwdDialogProps> = ({
  onClose,
  onSubmit,
  onBack,
}) => {
  const [errorTipVisible, setErrorTipVisible] = useState<boolean>();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const [passphase, setPassphase] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [address, setAddress] = useState<string>();
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

  const handleChangePassphase = (val: string) => {
    setPassphase(val);
  };
  const padoServicePortListener = function (message: any) {
    if (message.resMethodName === 'decrypt') {
      console.log('page_get:decrypt:', 'exportWallet', message.res);
      if (message.res) {
        const { privateKey } = message.res;
        setPrivateKey(privateKey);
        setStep(2);
      } else {
        alert('Failed to decrypt wallet');
      }
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    }
  };
  const decryptingKeyStore = () => {
    padoServicePort.onMessage.addListener(padoServicePortListener);
    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: `decrypt`,
      params: {},
    };
    postMsg(padoServicePort, msg);
  };
  const handleClickNext = () => {
    if (step === 1) {
      if (!passphase) {
        setErrorTipVisible(true);
        return;
      }
      decryptingKeyStore();
    } else if (step === 2) {
      onSubmit();
    }
  };
  useEffect(() => {
    getUserInfo();
  }, []);
  useEffect(() => {
    passphase && setErrorTipVisible(false);
  }, [passphase]);

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog exportWalletDialog">
        <PBack onBack={onBack} />
        <main>
          <h1>Back up on-chain address</h1>
          <div className="infoWrapper">
            <div className="infoItem gray">
              <div className="label">On-chain address</div>
              <div className="value">
                <div className="left">{formatAddr}</div>
                <PCopy text={formatAddr} />
              </div>
            </div>
            {step === 1 && (
              <div className="infoItem">
                <div className="label">Enter your password to export</div>
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
};

export default ExportWallet;
