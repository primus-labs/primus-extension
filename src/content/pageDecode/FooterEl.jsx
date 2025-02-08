import React, { useMemo, useState, useEffect, useRef } from 'react';
import { getContentWithValue } from './utils';
const FooterEl = ({ status, resultStatus, errorTxt, activeRequest }) => {
  const ref = useRef(null);
  const [errorTxtSelf, setErrorTxtSelf] = useState({
    sourcePageTip: 'Error Message.',
  });
  useEffect(() => {
    setErrorTxtSelf(errorTxt);
  }, [errorTxt]);
  const ElCon = useMemo(() => {
    let el = null;
    const {
      PRE_ATTEST_PROMOT,
      verificationContent,
      attestationType,
      verificationValue,
    } = activeRequest;
    switch (status) {
      case 'uninitialized':
        el = (
          <>
            <span>{PRE_ATTEST_PROMOT?.[0]}</span>
            &nbsp;
            <p className="loading-text"></p>
          </>
        );
        break;
      case 'initialized':
        el = (
          <>
            <span>{PRE_ATTEST_PROMOT?.[1]}</span>
            &nbsp;
            <p className="loading-text"></p>
          </>
        );
        break;
      case 'verifying':
        const { verificationContent: vC } = getContentWithValue({
          attestationType,
          verificationContent,
          verificationValue,
        });
        el = `Verifying ${vC}`;
        break;
      case 'result':
        if (resultStatus === 'success') {
          el = 'Successfully verified.';
        } else {
          el = (
            <>
              {errorTxtSelf?.code && (
                <span className="errorCode">{errorTxtSelf?.code}.</span>
              )}
              <span>{errorTxtSelf?.sourcePageTip}.</span>
            </>
          );
        }
        break;
    }

    return el;
  }, [status, resultStatus, errorTxtSelf, activeRequest]);

  return (
    <div
      className={`pado-extension-footer ${status} ${
        resultStatus === 'success' ? 'suc' : 'fail'
      }`}
      ref={ref}
    >
      {ElCon}
    </div>
  );
};

export default FooterEl;
