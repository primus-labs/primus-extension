import React, { useState, useMemo, memo, useCallback } from 'react';
import PInput from '@/components/PInput/index';
import './index.sass';

interface SetPwdProps {
  onSubmit: (pwd: string) => void;
  title?: string;
  desc?: string;
  btnText?: string;
}

const SetPassword: React.FC<SetPwdProps> = memo(
  ({
    onSubmit,
    title = 'Set Password',
    desc = 'Enter an secure password to protect local data and private key.',
    btnText = 'OK',
  }) => {
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
      onSubmit(pwd);
    }, [pwd, confirm, errorTipVisible, onSubmit, pwdRules]);

    const handleChangePwd = useCallback((val: string) => {
      setPwd(val);
    }, []);
    const handleChangeConfirm = useCallback((val: string) => {
      setConfirm(val);
    }, []);

    return (
      <div className="setPasswordWrapper">
        <main>
          <h1>{title}</h1>
          <h2>{desc}</h2>
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
          <span>{btnText}</span>
        </button>
      </div>
    );
  }
);

export default SetPassword;
