import React, { useState, useMemo, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import PInput from '@/newComponents/PInput';
import PButton from '@/newComponents/PButton';

import { postMsg } from '@/utils/utils';
import {
  initWalletAddressActionAsync,
  initIfHadPwdAsync,
} from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

import './index.scss';
interface SetPwdDialogProps {
  onSubmit: () => void;
}
type PswFormType = {
  password: '';
  confirmation: '';
};

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(({ onSubmit }) => {
  const [pswForm, setPswForm] = useState<PswFormType>({
    password: '',
    confirmation: '',
  });
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
  const fetchBindUserAddress = useCallback(() => {
    chrome.storage.local.get(['userInfo'], (storedData) => {
      if (storedData['userInfo']) {
        const padoServicePortListener = async function (message: any) {
          if (message.resMethodName === 'bindUserAddress') {
            const { res } = message;
            console.log('page_get:bindUserAddress:', res);
            if (res) {
              await dispatch(initWalletAddressActionAsync());
              await dispatch(initIfHadPwdAsync());
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
  }, [formLegal, fetchBindUserAddress]);
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
    <div className="pFormWrapper pswForm">
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
      <PButton
        text="Confirm"
        className="fullWidth confirmBtn"
        disabled={!formLegal}
        onClick={handleClickNext}
      ></PButton>
    </div>
  );
});

export default SetPwdDialog;
