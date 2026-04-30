/**
 * Custom hooks for page decode attestation UI: status, message listener, timeouts, auto-start.
 */
import { useState, useEffect, useRef } from 'react';
import { STATUS, SESSION_KEYS, TIMING, ERROR_CODES } from './constants';
import { getNoteV2Extension } from '@/utils/attestationProcessNoteV2';

const PAGE_DECODE_SYNC_EVENT = 'pado-page-decode-sync';

/**
 * Persist result state to sessionStorage and update React state (shared by message listener and timeouts).
 */
function persistAndSetResult(setters, resultStatus, errorTxt, closeAt) {
  const effectiveCloseAt =
    closeAt ??
    Date.now() +
      (resultStatus === 'success'
        ? TIMING.COUNTDOWN_SECONDS_SUCCESS * 1000
        : TIMING.COUNTDOWN_SECONDS_ERROR * 1000);
  sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.RESULT);
  sessionStorage.setItem(SESSION_KEYS.RESULT_CLOSE_AT, String(effectiveCloseAt));
  if (errorTxt != null) {
    sessionStorage.setItem(SESSION_KEYS.ERROR_TXT, JSON.stringify(errorTxt));
  }
  if (resultStatus) {
    sessionStorage.setItem(SESSION_KEYS.RESULT_STATUS, resultStatus);
  }
  setters.setStatus(STATUS.RESULT);
  setters.setResultStatus(resultStatus ?? '');
  setters.setErrorTxt(errorTxt);
  setters.setResultCloseAt(effectiveCloseAt);
}

/** Restore and sync attestation status with sessionStorage. */
export function useAttestationStatus() {
  const [status, setStatus] = useState(STATUS.UNINITIALIZED);
  const statusRef = useRef(status);
  const [isReadyFetch, setIsReadyFetch] = useState(false);
  const [resultStatus, setResultStatus] = useState('');
  const [errorTxt, setErrorTxt] = useState();
  const [resultCloseAt, setResultCloseAt] = useState(null);

  useEffect(() => {
    const lastStatus = sessionStorage.getItem(SESSION_KEYS.STATUS);
    const lastResultStatus = sessionStorage.getItem(SESSION_KEYS.RESULT_STATUS);
    const lastErrorTxt = sessionStorage.getItem(SESSION_KEYS.ERROR_TXT);
    const lastResultCloseAt = sessionStorage.getItem(SESSION_KEYS.RESULT_CLOSE_AT);
    const lastIsReadyFetch = sessionStorage.getItem(SESSION_KEYS.READY);

    if (lastStatus) {
      setStatus(lastStatus);
      if (lastResultStatus) setResultStatus(lastResultStatus);
      if (lastErrorTxt && lastErrorTxt !== 'undefined') {
        try {
          setErrorTxt(JSON.parse(lastErrorTxt));
        } catch (_e) {
          // ignore invalid stored JSON
        }
      }
      if (lastResultCloseAt) {
        const parsed = Number(lastResultCloseAt);
        if (Number.isFinite(parsed)) {
          setResultCloseAt(parsed);
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
    resultCloseAt,
    setResultCloseAt,
  };
}

/** Listen for webRequestIsReady and end messages from background. Uses ref for setters so listener is registered once. */
export function useMessageListener(setters) {
  const settersRef = useRef(setters);
  settersRef.current = setters;

  useEffect(() => {
    const listenerFn = (request) => {
      const { name, params = {} } = request;
      const { result, failReason, closeAt } = params;
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
        persistAndSetResult(s, result ?? '', failReason, closeAt);
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);
    return () => chrome.runtime.onMessage.removeListener(listenerFn);
  }, []);

  useEffect(() => {
    const syncListener = (event) => {
      const s = settersRef.current;
      const detail = event?.detail || {};

      if (detail.isReady) {
        s.setIsReadyFetch(true);
        sessionStorage.setItem(SESSION_KEYS.READY, '1');
      }
      if (detail.phase === 'attesting') {
        s.setStatus(STATUS.VERIFYING);
        sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.VERIFYING);
      }
      if (detail.resultSnapshot) {
        persistAndSetResult(
          s,
          detail.resultSnapshot.result ?? '',
          detail.resultSnapshot.failReason,
          detail.resultSnapshot.closeAt
        );
      }
    };

    window.addEventListener(PAGE_DECODE_SYNC_EVENT, syncListener);
    return () => window.removeEventListener(PAGE_DECODE_SYNC_EVENT, syncListener);
  }, []);
}

/** Timeouts: show initialized, interception fail (00013), verifying-phase dialog timeout (default 2 min, overridable via activeRequest.pageDecodeVerifyTimeoutMs). */
export function useTimeoutManager(activeRequest, status, statusRef, setters) {
  const noteV2 = activeRequest?.ATTESTATION_PROCESS_NOTE_V2;
  const { setStatus } = setters;
  const PRE_ATTEST_PROMOT_V2 = activeRequest?.PRE_ATTEST_PROMOT_V2;
  const verifyingTimeoutMs =
    activeRequest?.pageDecodeVerifyTimeoutMs ?? TIMING.POLLING_TIMEOUT_MS;
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
            sourcePageTip: getNoteV2Extension(
              noteV2,
              ERROR_CODES.TARGET_DATA_MISSING,
              'No verifiable data was detected.'
            ),
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
            sourcePageTip: getNoteV2Extension(
              noteV2,
              ERROR_CODES.REQUEST_TIMED_OUT,
              'Request Timed Out'
            ),
          };
          persistAndSetResult(setters, 'warn', errorObj);
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'dataSourcePageDialogTimeout',
          });
        }
      }, verifyingTimeoutMs);
    }

    return () => {
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
    };
  }, [
    status,
    initializedShowTime,
    noteV2,
    verifyingTimeoutMs,
    setters.setStatus,
    setters.setResultStatus,
    setters.setErrorTxt,
  ]);
}

/** Auto-call handleConfirm when isReadyFetch becomes true and status is not result. */
export function useAutoStartWhenReady(
  isReadyFetch,
  handleConfirm,
  setters,
  pageDecodePhase
) {
  useEffect(() => {
    if (!isReadyFetch) return;
    const lastStatus = sessionStorage.getItem(SESSION_KEYS.STATUS);
    if (lastStatus === STATUS.RESULT) return;
    setters.setStatus(STATUS.VERIFYING);
    sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.VERIFYING);
    if (pageDecodePhase === 'attesting') {
      return;
    }
    if (lastStatus !== STATUS.VERIFYING) {
      handleConfirm();
    }
  }, [isReadyFetch, handleConfirm, setters, pageDecodePhase]);
}

/** Countdown from N seconds when status reaches RESULT, then call onComplete. */
export function useCountdown(status, countdownSeconds, resultCloseAt, onComplete) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const onCompleteRef = useRef(onComplete);
  const completeFiredRef = useRef(false);
  const resultSyncedRef = useRef('');
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (status !== STATUS.RESULT) {
      resultSyncedRef.current = '';
      completeFiredRef.current = false;
      setCountdown(countdownSeconds);
      return;
    }
    const nextSyncKey = `${countdownSeconds}:${resultCloseAt || ''}`;
    if (resultSyncedRef.current !== nextSyncKey) {
      resultSyncedRef.current = nextSyncKey;
      if (resultCloseAt && Number.isFinite(resultCloseAt)) {
        setCountdown(
          Math.max(Math.ceil((resultCloseAt - Date.now()) / 1000), 0)
        );
      } else {
        setCountdown(countdownSeconds);
      }
    }
  }, [status, countdownSeconds, resultCloseAt]);

  useEffect(() => {
    if (status !== STATUS.RESULT) return;

    const nextCountdown =
      resultCloseAt && Number.isFinite(resultCloseAt)
        ? Math.max(Math.ceil((resultCloseAt - Date.now()) / 1000), 0)
        : countdown;

    if (nextCountdown !== countdown) {
      setCountdown(nextCountdown);
      return;
    }

    if (countdown <= 0) {
      if (!completeFiredRef.current) {
        completeFiredRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      if (resultCloseAt && Number.isFinite(resultCloseAt)) {
        setCountdown(Math.max(Math.ceil((resultCloseAt - Date.now()) / 1000), 0));
        return;
      }
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, resultCloseAt]);

  return countdown;
}
