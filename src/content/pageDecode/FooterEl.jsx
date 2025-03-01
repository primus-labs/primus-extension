import React, { useMemo, useState, useEffect, useRef } from 'react';
import { getContentWithValue } from './utils';
const FooterEl = ({ status, resultStatus, errorTxt, activeRequest }) => {
  const [errorTxtSelf, setErrorTxtSelf] = useState({
    sourcePageTip: 'Error Message.',
  });
  useEffect(() => {
    console.log('timer2-2', status, errorTxt, resultStatus);
    if (status === 'result' && errorTxt) {
      setErrorTxtSelf(errorTxt);
    }
  }, [errorTxt, status]);
  const ElCon = useMemo(() => {
    let el = null;
    const {
      PRE_ATTEST_PROMOT_V2,
      verificationContent,
      attestationType,
      verificationValue,
    } = activeRequest;

    switch (status) {
      case 'uninitialized':
        const uninitializedTxt = PRE_ATTEST_PROMOT_V2?.[0]?.text[0];
        el = (
          <>
            <span>{uninitializedTxt}</span>
            <p className="loading-text"></p>
          </>
        );
        break;
      case 'initialized':
        const initializedTxtArr = PRE_ATTEST_PROMOT_V2?.[1]?.text;
        const initializedTxt1 = initializedTxtArr[0];
        const initializedTxt2 = initializedTxtArr[1];
        el = (
          <>
            <span>{initializedTxt1}</span>
            <p className="loading-text"></p>
            <p className="anotherLine">{initializedTxt2}</p>
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
              <span>&nbsp;{errorTxtSelf?.sourcePageTip}.</span>
            </>
          );
        }
        break;
    }
    return el;
  }, [status, resultStatus, errorTxtSelf?.code, activeRequest]);

  return (
    <div
      className={`pado-extension-footer ${status} ${
        resultStatus === 'success' ? 'suc' : 'fail'
      }`}
    >
      {ElCon}
    </div>
  );
};

export default FooterEl;
