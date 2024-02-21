import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import PInput from '@/components/PInput/index';
import PMask from '@/components/PMask';
import PBack from '@/components/PBack';
import PButton from '@/newComponents/PButton';
import PEye from '@/newComponents/PEye'
import PClose from '@/newComponents/PClose'

import { postMsg } from '@/utils/utils';
import { initWalletAddressActionAsync } from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import iconDone from '@/assets/newImg/layout/iconDone.svg';

import './index.scss';
interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  // onCancel: () => void;
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    const [eyeOpen, setEyeOpen] = useState<boolean>(false);
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
    const handleEyeOpen = useCallback(() => {
      setEyeOpen(b => !b)
    }, []);
    return (
      <PMask onClose={onClose} closeable={!fromEvents}>
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
              <div className="step step1 done">
                <img className="iconDone" src={iconDone} alt="" />
                <div className="txt">
                  <div className="tit">Set up password</div>
                  <div className="con">
                    <span>password placeholder</span>
                    <PEye open={eyeOpen} onClick={handleEyeOpen} />
                  </div>
                </div>
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
            {/* <div className="formWrapper">
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
            </div> */}
          </main>
          <PButton text="OK" onClick={handleClickNext}></PButton>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
