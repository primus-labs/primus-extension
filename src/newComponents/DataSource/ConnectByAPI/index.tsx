import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import SetPwdDialog from '@/newComponents/SetPwdDialog';
import SetAPIDialog from '@/newComponents/SetAPIDialog';
import './index.scss';

interface PButtonProps {
  onClose: () => void;
  onSubmit: () => void;
}

const Nav: React.FC<PButtonProps> = memo(({ onClose, onSubmit }) => {
  const [step, setStep] = useState<number>(1);
  const [hadSetPwd, setHadSetPwd] = useState<boolean>(false);

  const handleCloseSetPwdDialog = useCallback(() => {
    onClose()
  }, []);
  const handleSubmitSetPwdDialog = useCallback(() => {
    // onSubmit();
    setStep(2)
  }, []);
  const checkIfHadSetPwd = async () => {
    let { keyStore } = await chrome.storage.local.get(['keyStore']);
    setHadSetPwd(!!keyStore);
  };
  useEffect(() => {
    checkIfHadSetPwd();
  }, []);
  useEffect(() => {
    hadSetPwd && setStep(2);
  }, [hadSetPwd]);

  return (
    <div className="connectByAPIModel">
      {step === 1 && (
        <SetPwdDialog
          onClose={handleCloseSetPwdDialog}
          onSubmit={handleSubmitSetPwdDialog}
        />
      )}
      {/* {step === 2 && (
        <SetAPIDialog
          onClose={handleCloseSetPwdDialog}
          onSubmit={handleSubmitSetPwdDialog}
        />
      )} */}
    </div>
  );
});

export default Nav;
