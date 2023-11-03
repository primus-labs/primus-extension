import React, { memo, useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PButton from '@/components/PButton';
import PInput from '@/components/PInput';
import PMask from '@/components/PMask';

import PBack from '@/components/PBack';

import { postMsg } from '@/utils/utils';

import type { UserState } from '@/types/store';

import './index.scss';

interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ResetPassword: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit, onBack }) => {
    // console.log('ResetPassword');
    const [pwd, setPwd] = useState<string>();
    const [confirm, setConfirm] = useState<string>();
    const pwdRules = useMemo(() => {
      const initalRules = [
        {
          desc: '0-9 digits',
          reg: /\d/,
          legal: false,
        },
        {
          desc: 'a-z letters',
          reg: /[A-Za-z]/,
          legal: false,
        },
        {
          desc: 'Special symbols',
          reg: /[\~!@#$%^&*()?,./;'<>:"_-]/,
          legal: false,
        },
        {
          desc: 'Greater than 8 characters',
          reg: /[\w\W]{8,60}/,
          legal: false,
        },
      ];
      if (pwd) {
        const currentRules = initalRules.map((rule: any) => {
          if (rule.reg.test(pwd)) {
            rule.legal = true;
          }
          return rule;
        });
        // console.log(pwd, currentRules)
        return currentRules;
      } else {
        return initalRules;
      }
    }, [pwd]);
    const errorTipVisible = useMemo(() => {
      return pwd && confirm && pwd !== confirm;
    }, [pwd, confirm]);
    const handleClickNext = useCallback(async () => {
      if (!pwd || !confirm || errorTipVisible) {
        return;
      }
      const pwdIsLegal = pwdRules.every((i) => i.legal);
      if (!pwdIsLegal) {
        return;
      }
      handleSubmit(pwd);
    }, [pwd, confirm, errorTipVisible, onSubmit, pwdRules]);

    const handleChangePwd = useCallback((val: string) => {
      setPwd(val);
    }, []);
    const handleChangeConfirm = useCallback((val: string) => {
      setConfirm(val);
    }, []);
    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );

    const handleSubmit = useCallback(
      (newPwd: string) => {
        const padoServicePortListener = async function (message: any) {
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
      },
      [onSubmit, padoServicePort]
    );

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog setPwdDialog resetPwdDialog">
          <PBack onBack={onBack} />
          <main>
            <header>
              <h1>Change Password</h1>
              <h2>
                Enter a new password to setup. You will need to log in again
                when settings are finished.
              </h2>
            </header>
            <div className="formWrapper">
              <PInput
                type="password"
                placeholder="Please enter your password"
                onChange={handleChangePwd}
                visible
                label="Setting"
              />
              <div className="validateWrapper">
                <div className="descTitle">
                  The following combinations are recommended：
                </div>
                <ul className="descItems">
                  {pwdRules.map((i) => {
                    return (
                      <li
                        key={i.desc}
                        className={i.legal ? 'descItem checked' : 'descItem'}
                      >
                        {i.legal && <i className="iconfont icon-iconChecked" />}
                        <p>{i.desc}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {/* <h6 className="reconfirmLabel">Reconfirm</h6> */}
              <PInput
                type="password"
                placeholder="Please confirm your password"
                onChange={handleChangeConfirm}
                onSearch={handleClickNext}
                visible
                label="Reconfirm"
              />
              {errorTipVisible && (
                <p className="errorTip">Entered passwords differ!</p>
              )}
            </div>
          </main>

          {/* <SetPassword
            title="Change Password"
            desc="Enter a new password to setup. You will need to log in again when settings are finished."
            onSubmit={handleSubmit}
            btnText="Next"
          /> */}
          <PButton text="Next" onClick={handleClickNext} />
        </div>
      </PMask>
    );
  }
);

export default ResetPassword;
