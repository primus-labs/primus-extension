import React, { useMemo, useState, useEffect, useRef } from 'react';
import { getContentWithValue } from './utils';
const FooterEl = ({ status, resultStatus, errorTxt, activeRequest }) => {
  const [errorTxtSelf, setErrorTxtSelf] = useState({
    sourcePageTip: 'Error Message.',
  });
  useEffect(() => {
    console.log('timer2-2', status, resultStatus, errorTxt, errorTxtSelf);
    if (status === 'result' && errorTxt?.sourcePageTip) {
      console.log('timer2-7');
      setErrorTxtSelf(errorTxt);
    }
  }, [errorTxt?.sourcePageTip, status]);
  useEffect(() => {
    console.log('timer2-4', errorTxtSelf);
  }, [errorTxtSelf]);
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
        if (
          activeRequest?.attTemplateID ===
          '07866310-b51d-4ba6-bc10-f6e9272475f8'
        ) {
          const userName = activeRequest?.jumpTo.split('/').pop();
          el = el = `Verifying Your Follow of @${userName}`;
        } else {
          el = `Verifying ${vC}`;
        }

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
