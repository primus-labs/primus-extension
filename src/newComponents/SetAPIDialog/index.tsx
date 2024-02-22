import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import PInput from '@/newComponents/PInput';
import PMask from '@/newComponents/PMask';
import PBack from '@/components/PBack';
import PButton from '@/newComponents/PButton';
import PEye from '@/newComponents/PEye';
import PClose from '@/newComponents/PClose';

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
type PswFormType = {
  password: '';
  confirmation: '';
};

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    const [eyeOpen, setEyeOpen] = useState<boolean>(false);
    const [pswForm, setPswForm] = useState<PswFormType>({
      password: '',
      confirmation: '',
    });
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [accountAddr, setAccountAddr] = useState<any>();
    // const [pswForm.password, setPwd] = useState<string>();
    // const [confirm, setConfirm] = useState<string>();

    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );

    const dispatch: Dispatch<any> = useDispatch();

    const pwdRules = useMemo(() => {
      const initalRules = [
        {
          desc: '0-9 digits',
          reg: /\d/,
          legal: 0,
        },
        {
          desc: 'a-z letters',
          reg: /[A-Za-z]/,
          legal: 0,
        },
        // {
        //   desc: 'Special symbols',
        //   reg: /[\~!@#$%^&*()?,./;'<>:"_-]/,
        //   legal: 0,
        // },
        {
          desc: 'Greater than 8 characters',
          reg: /[\w\W]{8,60}/,
          legal: 0,
        },
      ];
      if (pswForm.password) {
        const currentRules = initalRules.map((rule: any) => {
          if (rule.reg.test(pswForm.password)) {
            rule.legal = 1;
          } else {
            rule.legal = 2;
          }
          return rule;
        });
        return currentRules;
      } else {
        return initalRules;
      }
    }, [pswForm.password]);

    const formLegalObj = useMemo(() => {
      const passwordLegal = pwdRules.every((i) => i.legal === 1);
      const confirmationLegal =
        pswForm.password &&
        pswForm.confirmation &&
        pswForm.password === pswForm.confirmation;
      return {
        password: pswForm.password ? (passwordLegal ? 1 : 2) : 0,
        confirmation: pswForm.confirmation ? (confirmationLegal ? 1 : 2) : 0,
      };
    }, [pwdRules, pswForm]);
    const formLegal = useMemo(() => {
      const Leagal = Object.values(formLegalObj).every((i) => i === 1);
      return Leagal;
    }, [formLegalObj]);

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
              password: pswForm.password,
            },
          });
          dispatch({
            type: 'setUserPassword',
            payload: pswForm.password,
          });
        }
      });
    }, [dispatch, onSubmit, padoServicePort, pswForm.password]);
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      fetchBindUserAddress();
    }, [pswForm.password, confirm, pwdRules, fetchBindUserAddress]);
    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);
    const ruleClassNameFn = (legal: number) => {
      var cN = 'descItem';
      switch (legal) {
        case 0:
          break;
        case 1:
          cN += ' legal';
          break;
        case 2:
          cN += ' illegal';
          break;
        default:
          break;
      }
      return cN;
    };
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
            <div className="formWrapper pswForm">
              <div className="formItem">
                <PInput
                  label="Setup your password"
                  placeholder="Please enter your password"
                  type="password"
                  onChange={(p) => {
                    handleChangePswForm(p, 'password');
                  }}
                  value={pswForm.password}
                />
                <div className="validateWrapper">
                  <div className="descTitle">
                    The following combinations are recommended：
                  </div>
                  <ul className="descItems">
                    {pwdRules.map((i) => {
                      return (
                        <li key={i.desc} className={ruleClassNameFn(i.legal)}>
                          {i.legal > 0 && (
                            <i
                              className={`iconfont ${
                                i.legal === 1 ? 'icon-Legal' : 'icon-Illegal'
                              }`}
                            />
                          )}
                          <p>{i.desc}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="formItem">
                <PInput
                  label="Reconfirmation"
                  placeholder="Please confirm your password"
                  type="password"
                  onChange={(p) => {
                    handleChangePswForm(p, 'confirmation');
                  }}
                  value={pswForm.confirmation}
                  errorTip={
                    formLegalObj.confirmation === 2
                      ? 'Entered passwords differ!'
                      : undefined
                  }
                />
              </div>
            </div>
          </main>
          <footer>
            <PButton
              text="Confirm"
              className="fullWidthBtn"
              disabled={!formLegal}
              onClick={handleClickNext}
            ></PButton>
          </footer>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
