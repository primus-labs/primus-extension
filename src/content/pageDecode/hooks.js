/**
 * Custom hooks for page decode attestation UI: status, message listener, timeouts, auto-start.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const ATTESTATION_POLLING_TIMEOUT_MS = 2 * 60 * 1000;

/** Restore and sync attestation status with sessionStorage. */
export function useAttestationStatus() {
  const [status, setStatus] = useState('uninitialized');
  const statusRef = useRef(status);
  const [isReadyFetch, setIsReadyFetch] = useState(false);
  const [resultStatus, setResultStatus] = useState('');
  const [errorTxt, setErrorTxt] = useState();

  useEffect(() => {
    const lastStatus = sessionStorage.getItem('padoAttestRequestStatus');
    const lastResultStatus = sessionStorage.getItem('padoAttestRequestResultStatus');
    const lastErrorTxt = sessionStorage.getItem('padoAttestRequestErrorTxt');
    const lastIsReadyFetch = sessionStorage.getItem('padoAttestRequestReady');

    if (lastStatus) {
      setStatus(lastStatus);
      if (lastResultStatus === 'success') setResultStatus('success');
      if (lastErrorTxt && lastErrorTxt !== 'undefined') {
        try {
          setErrorTxt(JSON.parse(lastErrorTxt));
        } catch (_e) {}
      }
    } else {
      setStatus('uninitialized');
    }
    if (lastIsReadyFetch) setIsReadyFetch(lastIsReadyFetch === '1');
  }, []);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  return {
    status,
    setStatus,
    statusRef,
    isReadyFetch,
    setIsReadyFetch,
    resultStatus,
    setResultStatus,
    errorTxt,
    setErrorTxt,
  };
}

/** Listen for webRequestIsReady and end messages from background. */
export function useMessageListener(settors) {
  const {
    setIsReadyFetch,
    setStatus,
    setResultStatus,
    setErrorTxt,
  } = settors;

  useEffect(() => {
    const listenerFn = (request) => {
      const { name, params = {} } = request;
      const { result, failReason } = params;

      if (name === 'webRequestIsReady') {
        setIsReadyFetch(true);
        sessionStorage.setItem('padoAttestRequestReady', '1');
      }
      if (name === 'end') {
        setStatus('result');
        sessionStorage.setItem('padoAttestRequestStatus', 'result');
        if (failReason) {
          sessionStorage.setItem(
            'padoAttestRequestErrorTxt',
            JSON.stringify(failReason)
          );
        }
        if (result === 'success') {
          sessionStorage.setItem('padoAttestRequestResultStatus', 'success');
        }
        setResultStatus(result ?? '');
        setErrorTxt(failReason);
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);
    return () => chrome.runtime.onMessage.removeListener(listenerFn);
  }, [setIsReadyFetch, setStatus, setResultStatus, setErrorTxt]);
}

/** Timeouts: show initialized, interception fail (00013), data source dialog timeout (2 min). */
export function useTimeoutManager(activeRequest, status, statusRef, settors) {
  const { setStatus, setResultStatus, setErrorTxt } = settors;

  useEffect(() => {
    const PRE_ATTEST_PROMOT_V2 = activeRequest?.PRE_ATTEST_PROMOT_V2;
    const uninitializedShowTime = PRE_ATTEST_PROMOT_V2?.[0]?.showTime;
    const timer = setTimeout(() => {
      const lastStatus = sessionStorage.getItem('padoAttestRequestStatus');
      if (!['verifying', 'result'].includes(lastStatus)) {
        setStatus('initialized');
        sessionStorage.setItem('padoAttestRequestStatus', 'initialized');
      }
    }, uninitializedShowTime ?? 5000);
    return () => clearTimeout(timer);
  }, [setStatus]);

  useEffect(() => {
    const PRE_ATTEST_PROMOT_V2 = activeRequest?.PRE_ATTEST_PROMOT_V2;
    const initializedShowTime = PRE_ATTEST_PROMOT_V2?.[1]?.showTime;
    let timer2;
    let timer3;

    if (status === 'initialized') {
      timer2 = setTimeout(() => {
        if (!['verifying', 'result'].includes(statusRef.current)) {
          sessionStorage.setItem('padoAttestRequestStatus', 'result');
          const errorObj = {
            code: '00013',
            sourcePageTip: 'Target data missing',
          };
          sessionStorage.setItem(
            'padoAttestRequestErrorTxt',
            JSON.stringify(errorObj)
          );
          setStatus('result');
          setResultStatus('warn');
          setErrorTxt(errorObj);
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'interceptionFail',
          });
        }
      }, initializedShowTime ?? 30000);
    }

    if (status === 'verifying') {
      timer3 = setTimeout(() => {
        if (!['result'].includes(statusRef.current)) {
          setStatus('result');
          sessionStorage.setItem('padoAttestRequestStatus', 'result');
          const errorObj = {
            code: '00002',
            sourcePageTip: 'Request Timed Out',
          };
          sessionStorage.setItem(
            'padoAttestRequestErrorTxt',
            JSON.stringify(errorObj)
          );
          setResultStatus('warn');
          setErrorTxt(errorObj);
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'dataSourcePageDialogTimeout',
          });
        }
      }, ATTESTATION_POLLING_TIMEOUT_MS);
    }

    return () => {
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
    };
  }, [status, setStatus, setResultStatus, setErrorTxt]);
}

/** Auto-call handleConfirm when isReadyFetch becomes true and status is not result. */
export function useAutoStartWhenReady(isReadyFetch, handleConfirm, settors) {
  const { setStatus } = settors;
  useEffect(() => {
    if (!isReadyFetch) return;
    const lastStatus = sessionStorage.getItem('padoAttestRequestStatus');
    if (['result'].includes(lastStatus)) return;
    setStatus('verifying');
    sessionStorage.setItem('padoAttestRequestStatus', 'verifying');
    if (lastStatus !== 'verifying') {
      handleConfirm();
    }
  }, [isReadyFetch, handleConfirm, setStatus]);
}
