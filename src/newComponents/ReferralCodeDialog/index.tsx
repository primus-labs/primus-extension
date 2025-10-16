import React, { memo, useMemo, useCallback, useState } from 'react';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';

import PInput from '@/newComponents/PInput';
import PButton from '@/newComponents/PButton';
import './index.scss';

interface PButtonProps {
  sourceName: string;
  onClose: () => void;
  onSubmit: () => void;
}
type PswFormType = {
  password: '';
};
const Nav: React.FC<PButtonProps> = memo(
  ({ onClose, onSubmit, sourceName }) => {
    const [pswForm, setPswForm] = useState<PswFormType>({
      password: '',
    });
    const formLegalObj = useMemo(() => {
      return {
        password: pswForm.password ? 1 : 0,
      };
    }, [pswForm]);
    const formLegal = useMemo(() => {
      const Leagal = Object.values(formLegalObj).every((i) => i === 1);
      return Leagal;
    }, [formLegalObj]);
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
    }, [formLegal]);
    const handleClickSkip = useCallback(() => {}, []);
    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);

    return (
      <PMask>
        <div className="pDialog2 creferralCodeDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Referral Code</h1>
              <h2>Please paste your referral code here.</h2>
            </header>
            <div className="pFormWrapper pswForm">
              <div className="formItem">
                <PInput
                  label="Referral Code"
                  placeholder="Please enter your referral code"
                  type="text"
                  onChange={(p) => {
                    handleChangePswForm(p, 'password');
                  }}
                  value={pswForm.password}
                />

                <PButton
                  text="Confirm"
                  className="fullWidth confirmBtn"
                  disabled={!formLegal}
                  onClick={handleClickNext}
                ></PButton>
                <PButton
                  text="I don't have one, skip now"
                  type="text2"
                  className="fullWidth skipBtn"
                  onClick={handleClickSkip}
                ></PButton>
              </div>
            </div>
          </main>
        </div>
      </PMask>
    );
  }
);

export default Nav;
