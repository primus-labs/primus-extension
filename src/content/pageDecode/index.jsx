import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import RightEl from './RightEl';
import FooterEl from './FooterEl';
import HeaderEl from './HeaderEl';
import FriendlyTip from './FriendlyTip';
import { injectFont, createDomElement, eventReport } from './utils';
import { logicForMonad } from './logicForSdk';

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

function PadoCard() {
  const [UIStep, setUIStep] = useState('loading');
  const [status, setStatus] = useState('uninitialized');
  const [isReadyFetch, setIsReadyFetch] = useState(false);
  const [resultStatus, setResultStatus] = useState('');
  const [errorTxt, setErrorTxt] = useState();

  var iconPado = chrome.runtime.getURL(`iconPado.svg`);

  useEffect(() => {
    const lastStatus = sessionStorage.getItem('padoAttestRequestStatus');
    const lastIsReadyFetch = sessionStorage.getItem('padoAttestRequestReady');
    const lastPrimusUIStep = sessionStorage.getItem('primusUIStep');

    if (lastStatus) {
      setStatus(lastStatus);
    } else {
      setStatus('uninitialized');
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
        console.log('content receive:end', request, failReason);
        setStatus('result');
        sessionStorage.setItem('padoAttestRequestStatus', 'result');
        setResultStatus(result);
        setErrorTxt(failReason);
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listenerFn);
    };
  }, []);

  const handleBack = useCallback(async () => {
    var msgObj = {
      type: 'pageDecode',
      name: 'close',
      params: {
        tabId: activeRequest?.tabId,
      },
    };
    await chrome.runtime.sendMessage(msgObj);
    removeStorageValuesFn();
  }, [activeRequest?.tabId]);
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
  }, []);
  useEffect(() => {
    if (isReadyFetch) {
      const lastStatus = sessionStorage.getItem('padoAttestRequestStatus');
      if (!['result'].includes(lastStatus)) {
        setStatus('verifying');
        sessionStorage.setItem('padoAttestRequestStatus', 'verifying');
        if (lastStatus !== 'verifying') {
          handleConfirm();
        }
      }
    }
  }, [isReadyFetch]);

  useEffect(() => {
    const { PRE_ATTEST_PROMOT_V2 } = activeRequest;
    const uninitializedShowTime = PRE_ATTEST_PROMOT_V2?.[0]?.showTime;
    const initializedShowTime = PRE_ATTEST_PROMOT_V2?.[1]?.showTime;
    let timer2;
    let timer = setTimeout(() => {
      const lastStatus = sessionStorage.getItem('padoAttestRequestStatus');
      if (!['verifying', 'result'].includes(lastStatus)) {
        setStatus('initialized');
        sessionStorage.setItem('padoAttestRequestStatus', 'initialized');
        timer2 = setTimeout(() => {
          const lastStatus2 = sessionStorage.getItem('padoAttestRequestStatus');
          console.log('timer2', lastStatus, lastStatus2);
          if (!['verifying', 'result'].includes(lastStatus2)) {
            // It prompts that the requests for the template cannot be intercepted.
            setStatus('result');
            sessionStorage.setItem('padoAttestRequestStatus', 'result');
            setResultStatus('warn');
            setErrorTxt({
              code: '00013',
              sourcePageTip: 'Target data missing',
            });
            var msgObj = {
              type: 'pageDecode',
              name: 'interceptionFail',
            };
            chrome.runtime.sendMessage(msgObj);
          }
        }, initializedShowTime);
      }
    }, uninitializedShowTime);
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (timer2) {
        clearTimeout(timer2);
      }
    };
  }, []);

  return (
    <>
      {(activeRequest.dataSourceId === 'chatgpt' && isReadyFetch) ||
      activeRequest.dataSourceId !== 'chatgpt' ? (
        <div className={`pado-extension-card  ${status}`}>
          <div className="pado-extension-left">
            <HeaderEl />
            <FooterEl
              status={status}
              resultStatus={resultStatus}
              errorTxt={errorTxt}
              activeRequest={activeRequest}
            />
          </div>
          <RightEl status={status} onBack={handleBack} />
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
      console.log('activeRequest', activeRequest);
      // TODO - templateId
      if (
        activeRequest.attTemplateID === 'be2268c1-56b2-438a-80cb-eddf2e850b63'
      ) {
        logicForMonad();
      }
      delete activeRequest.PADOSERVERURL;
      delete activeRequest.padoExtensionVersion;
      PADOSERVERURL = response.params.PADOSERVERURL;
      padoExtensionVersion = response.params.padoExtensionVersion;
      activeRequestid = response.params.requestid;
      operationType = response.operation;
      const container = document.getElementById('pado-extension-content');
      const root = createRoot(container);
      root.render(<PadoCard />);
    }
  }
);

injectFont();
