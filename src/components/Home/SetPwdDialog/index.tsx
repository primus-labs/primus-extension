import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AuthInfoHeader from '@/components/DataSourceDetail/AuthInfoHeader';
import PInput from '@/components/PInput/index';
import PMask from '@/components/PMask';
import PBack from '@/components/PBack';
import iconAddress from '@/assets/img/iconAddress.svg';

import { postMsg } from '@/utils/utils';
import { initWalletAddressActionAsync } from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

import './index.sass';
interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit, onCancel }) => {
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
      chrome.storage.local.get(['userInfo', 'invitationCode'], (storedData) => {
        if (storedData['userInfo']) {
          const userId = JSON.parse(storedData['userInfo']).id;
          const padoServicePortListener = async function (message: any) {
            if (message.resMethodName === 'bindUserAddress') {
              const { res } = message;
              console.log('page_get:bindUserAddress:', res);
              if (res) {
                await dispatch(initWalletAddressActionAsync());
                onSubmit();
              } else {
                // loading
                alert('BindUserAddress network error');
              }
            }
          };
          padoServicePort.onMessage.addListener(padoServicePortListener);
          const { token } = userInfo;

          postMsg(padoServicePort, {
            fullScreenType: 'padoService',
            reqMethodName: 'bindUserAddress',
            params: {
              userId: userId,
              walletAddress: accountAddr,
              password: pwd,
            },
            config: {
              // TODO
              extraHeader: {
                'user-id': userId,
                Authorization: `Bearer ${token}`,
                'invite-code': storedData.invitationCode,
              },
            },
          });
          dispatch({
            type: 'setUserPassword',
            payload: pwd,
          });
        }
      });
    }, [accountAddr, dispatch, onSubmit, padoServicePort, pwd]);
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

    const handleClickBack = () => {
      onCancel();
    };
    const initAccount = () => {
      const padoServicePortListener = function (message: any) {
        if (message.resMethodName === 'create') {
          console.log('page_get:create:', message.res);
          if (message.res) {
            const lowercaseAddr = message.res.toLowerCase();
            setAccountAddr(lowercaseAddr);
          }
        }
      };
      padoServicePort.onMessage.addListener(padoServicePortListener);

      const msg = {
        fullScreenType: 'wallet',
        reqMethodName: 'create',
        params: {},
      };
      postMsg(padoServicePort, msg);
    };
    const handleChangePwd = useCallback((val: string) => {
      setPwd(val);
    }, []);
    const handleChangeConfirm = (val: string) => {
      setConfirm(val);
    };

    useEffect(() => {
      initAccount();
    }, []);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog setPwdDialog">
          <PBack onBack={handleClickBack} />
          <main>
            <AuthInfoHeader checked={true} />
            <h1>Set Password</h1>
            <h6>Setting</h6>
            <PInput
              type="password"
              placeholder="Please enter your password"
              onChange={handleChangePwd}
              visible
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
                      {i.desc}
                    </li>
                  );
                })}
              </ul>
            </div>
            <h6 className="reconfirmLabel">Reconfirm</h6>
            <PInput
              type="password"
              placeholder="Please confirm your password"
              onChange={handleChangeConfirm}
              onSearch={handleClickNext}
              visible
            />
            {errorTipVisible && (
              <p className="errorTip">Entered passwords differ!</p>
            )}
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>OK</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
