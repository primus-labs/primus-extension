import React, { useMemo, useState, useEffect, useRef } from 'react';
const FooterEl = ({
  status,
  resultStatus,
  errorTxt,
  PRE_ATTEST_PROMOT,
  verificationContent,
}) => {
  const ref = useRef(null);
  const [errorTxtSelf, setErrorTxtSelf] = useState({
    sourcePageTip: 'Error Message.',
  });
  useEffect(() => {
    setErrorTxtSelf(errorTxt);
  }, [errorTxt]);
  const ElCon = useMemo(() => {
    let el = null;
    switch (status) {
      case 'uninitialized':
        el = PRE_ATTEST_PROMOT?.[0];
        break;
      case 'initialized':
        el = PRE_ATTEST_PROMOT?.[1];
        break;
      case 'verifying':
        el = verificationContent;
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
  }, [
    status,
    resultStatus,
    errorTxtSelf,
    PRE_ATTEST_PROMOT,
    verificationContent,
  ]);

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

