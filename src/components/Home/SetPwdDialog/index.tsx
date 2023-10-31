import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import PInput from '@/components/PInput/index';
import PMask from '@/components/PMask';
import PBack from '@/components/PBack';
import PButton from '@/components/PButton';

import { postMsg } from '@/utils/utils';
import { initWalletAddressActionAsync } from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

import './index.scss';
interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit, onCancel }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [accountAddr, setAccountAddr] = useState<any>();
    const [pwd, setPwd] = useState<string>();
    const [confirm, setConfirm] = useState<string>();

    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );

    const dispatch: Dispatch<any> = useDispatch();

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

    const userInfo = useSelector((state: UserState) => state.userInfo);
    const fetchBindUserAddress = useCallback(() => {
      chrome.storage.local.get(['userInfo'], (storedData) => {
        if (storedData['userInfo']) {
          const padoServicePortListener = async function (message: any) {
            if (message.resMethodName === 'bindUserAddress') {
              const { res } = message;
              console.log('page_get:bindUserAddress:', res);
              if (res) {
                await dispatch(initWalletAddressActionAsync());
                onSubmit();
              } else {
              }
            }
          };
          padoServicePort.onMessage.addListener(padoServicePortListener);

          postMsg(padoServicePort, {
            fullScreenType: 'padoService',
            reqMethodName: 'bindUserAddress',
            params: {
              password: pwd,
            },
          });
          dispatch({
            type: 'setUserPassword',
            payload: pwd,
          });
        }
      });
    }, [dispatch, onSubmit, padoServicePort, pwd]);
    const handleClickNext = useCallback(async () => {
      if (!pwd || !confirm || errorTipVisible) {
        return;
      }
      const pwdIsLegal = pwdRules.every((i) => i.legal);
      if (!pwdIsLegal) {
        return;
      }
      fetchBindUserAddress();
    }, [pwd, confirm, errorTipVisible, pwdRules, fetchBindUserAddress]);

    const handleChangePwd = useCallback((val: string) => {
      setPwd(val);
    }, []);
    const handleChangeConfirm = (val: string) => {
      setConfirm(val);
    };

    return (
      <PMask onClose={onClose} closeable={!fromEvents}>
        <div className="padoDialog setPwdDialog">
          <main>
            <header>
              <h1>Set Password</h1>
              <h2>
                Set a password to protect local data and unlock your account.
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
          <PButton text="OK" onClick={handleClickNext}></PButton>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
