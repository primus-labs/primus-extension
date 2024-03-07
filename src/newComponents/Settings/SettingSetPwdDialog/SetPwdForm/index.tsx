import React, { useState, useMemo, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import PInput from '@/newComponents/PInput';
import PButton from '@/newComponents/PButton';

import { postMsg } from '@/utils/utils';
import { initWalletAddressActionAsync } from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

import './index.scss';

interface SetPwdDialogProps {
  onSubmit: () => void;
  resetPwsSuccessCallback: () => void;
}

type PswFormType = {
  password: '';
  confirmation: '';
};

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(({ onSubmit, resetPwsSuccessCallback }) => {
  const [pswForm, setPswForm] = useState<PswFormType>({
    password: '',
    confirmation: '',
  });

  const [formLegal, setFormLegal] = useState(false);
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort,
  );
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
          setFormLegal(true);
        } else {
          rule.legal = 2;
          setFormLegal(false);
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

  const handleClickNext = useCallback(async () => {
    if (!pswForm.password || !confirm) {
      return;
    }
    const pwdIsLegal = pwdRules.every((i) => i.legal);
    if (!pwdIsLegal) {
      return;
    }
    handleSubmit(pswForm.password);
  }, [pswForm.password, confirm, onSubmit, pwdRules]);

  const handleSubmit = useCallback(
    (newPwd: string) => {
      const padoServicePortListener = async function(message: any) {
        debugger
        if (message.resMethodName === 'resetPassword') {
          console.log('page_get:resetPassword:', message.res);
          if (message.res) {
            onSubmit();
            resetPwsSuccessCallback();
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
    [onSubmit, padoServicePort],
  );

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
