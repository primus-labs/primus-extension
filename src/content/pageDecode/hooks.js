/**
 * Custom hooks for page decode attestation UI: status, message listener, timeouts, auto-start.
 */
import { useState, useEffect, useRef } from 'react';
import { STATUS, SESSION_KEYS, TIMING, ERROR_CODES } from './constants';

/**
 * Persist result state to sessionStorage and update React state (shared by message listener and timeouts).
 */
function persistAndSetResult(setters, resultStatus, errorTxt) {
  sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.RESULT);
  if (errorTxt != null) {
    sessionStorage.setItem(SESSION_KEYS.ERROR_TXT, JSON.stringify(errorTxt));
  }
  if (resultStatus === 'success') {
    sessionStorage.setItem(SESSION_KEYS.RESULT_STATUS, 'success');
  }
  setters.setStatus(STATUS.RESULT);
  setters.setResultStatus(resultStatus ?? '');
  setters.setErrorTxt(errorTxt);
}

/** Restore and sync attestation status with sessionStorage. */
export function useAttestationStatus() {
  const [status, setStatus] = useState(STATUS.UNINITIALIZED);
  const statusRef = useRef(status);
  const [isReadyFetch, setIsReadyFetch] = useState(false);
  const [resultStatus, setResultStatus] = useState('');
  const [errorTxt, setErrorTxt] = useState();

  useEffect(() => {
    const lastStatus = sessionStorage.getItem(SESSION_KEYS.STATUS);
    const lastResultStatus = sessionStorage.getItem(SESSION_KEYS.RESULT_STATUS);
    const lastErrorTxt = sessionStorage.getItem(SESSION_KEYS.ERROR_TXT);
    const lastIsReadyFetch = sessionStorage.getItem(SESSION_KEYS.READY);

    if (lastStatus) {
      setStatus(lastStatus);
      if (lastResultStatus === 'success') setResultStatus('success');
      if (lastErrorTxt && lastErrorTxt !== 'undefined') {
        try {
          setErrorTxt(JSON.parse(lastErrorTxt));
        } catch (_e) {
          // ignore invalid stored JSON
        }
      }
    } else {
      setStatus(STATUS.UNINITIALIZED);
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

/** Listen for webRequestIsReady and end messages from background. Uses ref for setters so listener is registered once. */
export function useMessageListener(setters) {
  const settersRef = useRef(setters);
  settersRef.current = setters;

  useEffect(() => {
    const listenerFn = (request) => {
      const { name, params = {} } = request;
      const { result, failReason } = params;
      const s = settersRef.current;

      if (name === 'webRequestIsReady') {
        s.setIsReadyFetch(true);
        sessionStorage.setItem(SESSION_KEYS.READY, '1');
      }
      if (name === 'end') {
        if (failReason != null) {
          sessionStorage.setItem(
            SESSION_KEYS.ERROR_TXT,
            JSON.stringify(failReason)
          );
        }
        if (result === 'success') {
          sessionStorage.setItem(SESSION_KEYS.RESULT_STATUS, 'success');
        }
        persistAndSetResult(s, result ?? '', failReason);
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);
    return () => chrome.runtime.onMessage.removeListener(listenerFn);
  }, []);
}

/** Timeouts: show initialized, interception fail (00013), data source dialog timeout (2 min). */
export function useTimeoutManager(activeRequest, status, statusRef, setters) {
  const { setStatus } = setters;
  const PRE_ATTEST_PROMOT_V2 = activeRequest?.PRE_ATTEST_PROMOT_V2;
  const uninitializedShowTime =
    PRE_ATTEST_PROMOT_V2?.[0]?.showTime ?? TIMING.DEFAULT_UNINIT_MS;
  const initializedShowTime =
    PRE_ATTEST_PROMOT_V2?.[1]?.showTime ?? TIMING.DEFAULT_INIT_MS;

  useEffect(() => {
    const timer = setTimeout(() => {
      const lastStatus = sessionStorage.getItem(SESSION_KEYS.STATUS);
      if (![STATUS.VERIFYING, STATUS.RESULT].includes(lastStatus)) {
        setStatus(STATUS.INITIALIZED);
        sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.INITIALIZED);
      }
    }, uninitializedShowTime);
    return () => clearTimeout(timer);
  }, [setStatus, uninitializedShowTime]);

  useEffect(() => {
    let timer2;
    let timer3;

    if (status === STATUS.INITIALIZED) {
      timer2 = setTimeout(() => {
        if (![STATUS.VERIFYING, STATUS.RESULT].includes(statusRef.current)) {
          const errorObj = {
            code: ERROR_CODES.TARGET_DATA_MISSING,
            sourcePageTip: 'Target data missing',
          };
          persistAndSetResult(setters, 'warn', errorObj);
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'interceptionFail',
          });
        }
      }, initializedShowTime);
    }

    if (status === STATUS.VERIFYING) {
      timer3 = setTimeout(() => {
        if (statusRef.current !== STATUS.RESULT) {
          const errorObj = {
            code: ERROR_CODES.REQUEST_TIMED_OUT,
            sourcePageTip: 'Request Timed Out',
          };
          persistAndSetResult(setters, 'warn', errorObj);
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'dataSourcePageDialogTimeout',
          });
        }
      }, TIMING.POLLING_TIMEOUT_MS);
    }

    return () => {
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
    };
  }, [
    status,
    initializedShowTime,
    setters.setStatus,
    setters.setResultStatus,
    setters.setErrorTxt,
  ]);
}

/** Auto-call handleConfirm when isReadyFetch becomes true and status is not result. */
export function useAutoStartWhenReady(isReadyFetch, handleConfirm, setters) {
  useEffect(() => {
    if (!isReadyFetch) return;
    const lastStatus = sessionStorage.getItem(SESSION_KEYS.STATUS);
    if (lastStatus === STATUS.RESULT) return;
    setters.setStatus(STATUS.VERIFYING);
    sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.VERIFYING);
    if (lastStatus !== STATUS.VERIFYING) {
      handleConfirm();
    }
  }, [isReadyFetch, handleConfirm, setters]);
}
