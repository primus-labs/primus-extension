import React, { useMemo, useState, useEffect } from 'react';
const FooterEl = ({
  status,
  resultStatus,
  errorTxt,
  PRE_ATTEST_PROMOT,
  verificationContent,
}) => {
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
  useEffect(() => {
    console.log('start-footer----', status, +new Date());
  }, [status]);

  return (
    <div
      className={`pado-extension-footer ${status} ${
        resultStatus === 'success' ? 'suc' : 'fail'
      }`}
    >
      {status === 'uninitialized' && PRE_ATTEST_PROMOT?.[0]}
      {status === 'initialized' && PRE_ATTEST_PROMOT?.[1]}
      {status === 'verifying' && verificationContent}
      {status === 'result' && resultStatus === 'success' ? (
        'Successfully verified.'
      ) : (
        <>
          {errorTxtSelf?.code && (
            <span className="errorCode">{errorTxtSelf?.code}.</span>
          )}
          <span>{errorTxtSelf?.sourcePageTip}.</span>
        </>
      )}
    </div>
  );
};

export default FooterEl;

function DataSourceLineEl({ list }) {
  return (
    <ul className="descWrapper initialized">
      {list.map((i) => {
        return (
          <li className="descItem" key={i.label}>
            <div className="label">{i.label}</div>
            <div className="value">{i.value}</div>
          </li>
        );
      })}
    </ul>
  );
}
function DescEl({ status, resultStatus, errorTxt }) {
  var iconSuc = chrome.runtime.getURL(`iconSucc.svg`);
  var iconFail = chrome.runtime.getURL(`iconFail.svg`);
  var host = activeRequest?.jumpTo
    ? new URL(activeRequest.jumpTo).origin
    : activeRequest?.datasourceTemplate.host;

  // var uiTemplate = activeRequest.uiTemplate;
  const [loadingTxt, setLoadingTxt] = useState('Connecting to Primus node...');
  const [errorTxtSelf, setErrorTxtSelf] = useState({
    sourcePageTip: 'Error Message.',
  });
  useEffect(() => {
    console.log('222content receive:end-2', errorTxt);
    setErrorTxtSelf(errorTxt);
  }, [errorTxt]);
  const descList = useMemo(() => {
    if (operationType === 'connect') {
      return [{ label: 'Data Source', value: host }];
    } else {
      const {
        attestationType,
        verificationContent,
        verificationValue,
        sdkVersion,
      } = activeRequest;

      let vC = verificationContent,
        vV = verificationValue;
      if (attestationType === 'Assets Verification') {
        if (verificationContent === 'Assets Proof') {
          vC = 'Asset balance';
          vV = `> $${verificationValue}`;
        } else if (verificationContent === 'Token Holding') {
          vC = 'Token holding';
        } else if (verificationContent === 'Spot 30-Day Trade Vol') {
          vC = 'Spot 30-day trade vol';
          vV = `> $${verificationValue}`;
        }
      } else if (attestationType === 'Social Connections') {
        if (verificationContent === 'X Followers') {
          vC = 'Followers number';
          vV = `> ${verificationValue}`;
        }
      }

      let arr = [
        { label: 'Data Source', value: host },
        {
          label: 'Verification Content',
          value: vC,
        },
      ];
      if (!sdkVersion) {
        arr.push({ label: 'Verification Condition', value: vV });
      }
      return arr;
    }
  }, []);

  const sucTxt = useMemo(() => {
    if (operationType === 'connect') {
      return 'Connect successfully!';
    } else {
      return 'Verified!';
    }
  }, []);

  return status === 'initialized' ? (
    <DataSourceLineEl list={descList} />
  ) : status === 'verifying' ? (
    <DataSourceLineEl list={descList} />
  ) : status === 'result' && resultStatus === 'success' ? (
    <div className="descWrapper result suc">
      <div className="label">
        <img src={iconSuc} alt="" />
        <span>{sucTxt}</span>
      </div>
      <div className="value">
        {activeRequest.dataSourceId === 'chatgpt'
          ? 'Please return to event page.'
          : 'Please return to Primus.'}
      </div>
    </div>
  ) : (
    <div className="descWrapper result fail">
      <div className="label">
        <div className="errorTipWrapper">
          <img src={iconFail} alt="" />
          <span>{errorTxtSelf?.sourcePageTip}</span>
          {errorTxtSelf?.code && (
            <span className="errorCode">{errorTxtSelf?.code}</span>
          )}
        </div>
      </div>
      <div className="value">
        {activeRequest.dataSourceId === 'chatgpt'
          ? 'Please return to event page.'
          : 'Please return to Primus.'}
      </div>
    </div>
  );
}
