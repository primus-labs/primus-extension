import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  injectFont,
  createDomElement,
  eventReport,
} from './utils';
import PButton from '../PButton';
import './index.scss';
console.log(
  '222padoAttestRequestStatus',
  sessionStorage.getItem('padoAttestRequestStatus')
);
let activeRequest;
let operationType;
let PADOSERVERURL;
let padoExtensionVersion;
let activeRequestid;

function removeStorageValuesFn() {
  sessionStorage.removeItem('padoAttestRequestStatus');
  sessionStorage.removeItem('padoAttestRequestReady');
  activeRequest = null;
  operationType = null;
}
function RightEl({ status }) {
  const handleOK = useCallback(async () => {
    removeStorageValuesFn();
    var msgObj = {
      type: 'pageDecode',
      name: 'close',
    };
    await chrome.runtime.sendMessage(msgObj);
  }, []);
  return status === 'initialized' ? (
    <div className="pado-extension-right initialized"></div>
  ) : status === 'verifying' ? (
    <div className="pado-extension-right verifying">
      <div className="loading-spinner"></div>
    </div>
  ) : (
    <div className={`pado-extension-right result`}>
      <PButton text="Back" onClick={handleOK} />
    </div>
  );
}
function FooterEl({ status, setStatus, isReadyFetch, resultStatus, errorTxt }) {
  const [errorTxtSelf, setErrorTxtSelf] = useState({
    sourcePageTip: 'Error Message.',
  });
  useEffect(() => {
    console.log('222content receive:end-2', errorTxt);
    setErrorTxtSelf(errorTxt);
  }, [errorTxt]);
  const handleOK = useCallback(async () => {
    removeStorageValuesFn();
    var msgObj = {
      type: 'pageDecode',
      name: 'close',
    };
    await chrome.runtime.sendMessage(msgObj);
  }, []);
  const handleCancel = useCallback(async () => {
    removeStorageValuesFn();
    var msgObj = {
      type: 'pageDecode',
      name: 'cancel',
    };
    await chrome.runtime.sendMessage(msgObj);
  }, []);
  const handleConfirm = useCallback(async () => {
    var eventInfo = {
      eventType: 'ATTESTATION_START',
      rawData: {
        source: activeRequest.dataSourceId,
        event: activeRequest.event,
        order: '2',
        requestid: activeRequestid,
      },
    };
    const { padoZKAttestationJSSDKBeginAttest } =
      await chrome.storage.local.get(['padoZKAttestationJSSDKBeginAttest']);
    if (padoZKAttestationJSSDKBeginAttest) {
      eventInfo.rawData.origin = 'padoAttestationJSSDK';
    }
    eventReport(eventInfo, PADOSERVERURL, padoExtensionVersion);

    var msgObj = {
      type: 'pageDecode',
      name: 'start',
    };
    await chrome.runtime.sendMessage(msgObj);
    setStatus('verifying');
    sessionStorage.setItem('padoAttestRequestStatus', 'verifying');
  }, []);
  useEffect(() => {
    if (isReadyFetch && status === 'initialized') {
      if (!sessionStorage.getItem('autoStartFlag')) {
        sessionStorage.setItem('autoStartFlag', '1');
        handleConfirm();
        console.log('start----');
      }
    }
  }, [isReadyFetch, status, handleConfirm]);

  return status === 'initialized' ? (
    <div className="pado-extension-footer initialized">
      {activeRequest.PRE_ATTEST_PROMOT}
    </div>
  ) : status === 'verifying' ? (
    <div className="pado-extension-footer verifying">
      {activeRequest.verificationContent}
    </div>
  ) : (
    <div
      className={`pado-extension-footer result ${
        resultStatus === 'success' ? 'suc' : 'fail'
      }`}
    >
      {resultStatus === 'success' ? (
        'Successfully verified.'
      ) : (
        <>
          {errorTxtSelf?.code && (
            <span className="errorCode">{errorTxtSelf?.code}</span>
          )}
          <span>{errorTxtSelf?.sourcePageTip}</span>
        </>
      )}
    </div>
  );
}
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
function PadoCard() {
  const [UIStep, setUIStep] = useState('loading');
  const [status, setStatus] = useState('initialized');
  const [isReadyFetch, setIsReadyFetch] = useState(false);
  const [resultStatus, setResultStatus] = useState('');
  const [errorTxt, setErrorTxt] = useState();

  var iconPado = chrome.runtime.getURL(`iconPado.svg`);
  var iconPrimusSquare = chrome.runtime.getURL(`iconPrimusSquare.svg`);

  useEffect(() => {
    const lastStatus = sessionStorage.getItem('padoAttestRequestStatus');
    const lastIsReadyFetch = sessionStorage.getItem('padoAttestRequestReady');
    const lastPrimusUIStep = sessionStorage.getItem('primusUIStep');
    if (lastStatus) {
      setStatus(lastStatus);
    }
    if (lastIsReadyFetch) {
      setIsReadyFetch(!!lastIsReadyFetch);
    }
    if (lastPrimusUIStep) {
      setUIStep(lastPrimusUIStep);
    }
  }, []);

  useEffect(() => {
    const listenerFn = (request, sender, sendResponse) => {
      var {
        name,
        params: { result, failReason, isReady, step },
      } = request;
      if (name === 'setUIStep') {
        console.log('content receive:setUIStep');
        setUIStep(step);
        sessionStorage.setItem('primusUIStep', step);
      }
      if (name === 'webRequestIsReady') {
        console.log('content receive:webRequestIsReady');
        setIsReadyFetch(true);
        sessionStorage.setItem('padoAttestRequestReady', '1');
      }
      if (name === 'end') {
        console.log('222content receive:end', request, failReason);
        setStatus('result');
        sessionStorage.setItem('padoAttestRequestStatus', 'result');
        sessionStorage.removeItem('autoStartFlag');
        setResultStatus(result);
        setErrorTxt(failReason);
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listenerFn);
    };
  }, []);

  const FriendlyTip = ({ tipKey }) => {
    const tipMap = {
      toLogin: 'Login to start...',
      toMessage: 'Message GPT and wait for a reply...',
      toVerify: 'Processing the data parameters...',
    };
    return (
      <div className="tipStep">
        <img src={iconPrimusSquare} className="iconPrimusSquare" />
        <div className="tip">{tipMap[tipKey]}</div>
      </div>
    );
  };

  return (
    <>
      {(activeRequest.dataSourceId === 'chatgpt' && isReadyFetch) ||
      activeRequest.dataSourceId !== 'chatgpt' ? (
        <div className={`pado-extension-card  ${status}`}>
          <div className="pado-extension-left">
            <div className="pado-extension-header">
              <img src={iconPado} className="iconPado" />
              <div className="pado-extenstion-center-title">
                Verify Your Data
              </div>
            </div>
            <FooterEl
              status={status}
              setStatus={setStatus}
              isReadyFetch={isReadyFetch}
              resultStatus={resultStatus}
              errorTxt={errorTxt}
            />
          </div>
          <RightEl status={status} />
        </div>
      ) : (
        <div className="padoWrapper">
          {['toLogin', 'toMessage', 'toVerify'].includes(UIStep) && (
            <FriendlyTip tipKey={UIStep}></FriendlyTip>
          )}
          {!isReadyFetch && (
            <div className="loadingStep">
              <img src={iconPado} className="iconPado" />
              <div className="loading-spinner loader"></div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

var padoStr = `<div id="pado-extension-content"></div>`;
var injectEl = createDomElement(padoStr);
document.body.appendChild(injectEl);
console.log(
  'content_scripts-content-decode inject',
  new Date().toLocaleString()
);
chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'initCompleted', // diff
  },
  (response, a, b) => {
    if (response.name === 'append') {
      console.log('content_scripts-content-decode receive:append');
      // hide in login page
      var disabledPathList = ['login', 'register'];
      var isDisabled = disabledPathList.some(
        (i) => window.location.href.indexOf(i) > -1
      );
      if (isDisabled) {
        return;
      }
      // avoid re-render
      if (activeRequest) {
        if (response.isReady) {
          sessionStorage.setItem('padoAttestRequestReady', '1');
        }
        return;
      }
      // render
      activeRequest = { ...response.params };
      delete activeRequest.PADOSERVERURL;
      delete activeRequest.padoExtensionVersion;
      PADOSERVERURL = response.params.PADOSERVERURL;
      padoExtensionVersion = response.params.padoExtensionVersion;
      activeRequestid = response.params.requestid;
      console.log('222response', response); //delete
      operationType = response.operation;
      const container = document.getElementById('pado-extension-content');
      const root = createRoot(container);
      root.render(<PadoCard />);
    }
  }
);

injectFont();
