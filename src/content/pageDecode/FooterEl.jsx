import React, { useMemo, useState, useEffect } from 'react';
import { STATUS } from './constants';

const FooterEl = ({ status, resultStatus, errorTxt, activeRequest }) => {
  const [errorTxtSelf, setErrorTxtSelf] = useState({
    sourcePageTip: 'Error Message.',
  });

  useEffect(() => {
    if (status === STATUS.RESULT && errorTxt?.sourcePageTip) {
      setErrorTxtSelf(errorTxt);
    }
  }, [status, errorTxt?.sourcePageTip, errorTxt]);

  const ElCon = useMemo(() => {
    let el = null;
    const { PRE_ATTEST_PROMOT_V2, verificationContent, verificationValue } =
      activeRequest || {};

    switch (status) {
      case STATUS.UNINITIALIZED: {
        const uninitializedTxt = PRE_ATTEST_PROMOT_V2?.[0]?.text?.[0];
        el = (
          <>
            <span>{uninitializedTxt}</span>
            <p className="loading-text" />
          </>
        );
        break;
      }
      case STATUS.INITIALIZED: {
        const initializedTxtArr = PRE_ATTEST_PROMOT_V2?.[1]?.text;
        const initializedTxt1 = initializedTxtArr?.[0];
        const initializedTxt2 = initializedTxtArr?.[1];
        el = (
          <>
            <span>{initializedTxt1}</span>
            <p className="loading-text" />
            <p className="anotherLine">{initializedTxt2}</p>
          </>
        );
        break;
      }
      case STATUS.VERIFYING:
        el = `Verifying ${verificationContent ?? verificationValue ?? ''}`;
        break;
      case STATUS.RESULT:
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
      default:
        break;
    }
    return el;
  }, [status, resultStatus, errorTxtSelf, activeRequest]);

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
