/**
 * Page decode attestation card UI. Uses hooks for status, messages, and timeouts.
 */
import React, { useCallback, useMemo } from 'react';
import RightEl from './RightEl';
import FooterEl from './FooterEl';
import HeaderEl from './HeaderEl';
import {
  useAttestationStatus,
  useMessageListener,
  useTimeoutManager,
  useAutoStartWhenReady,
} from './hooks';
import { EXTENSION_VERSION } from './constants';

function PadoCard({ activeRequest }) {
  const {
    status,
    setStatus,
    statusRef,
    isReadyFetch,
    setIsReadyFetch,
    resultStatus,
    setResultStatus,
    errorTxt,
    setErrorTxt,
  } = useAttestationStatus();

  const setters = useMemo(
    () => ({
      setStatus,
      setIsReadyFetch,
      setResultStatus,
      setErrorTxt,
    }),
    [setStatus, setIsReadyFetch, setResultStatus, setErrorTxt]
  );

  useMessageListener(setters);
  useTimeoutManager(activeRequest, status, statusRef, setters);

  const handleBack = useCallback(async () => {
    await chrome.runtime.sendMessage({
      type: 'pageDecode',
      name: 'close',
      params: {
        tabId: activeRequest?.tabId,
        extensionVersion: EXTENSION_VERSION,
      },
    });
  }, [activeRequest?.tabId]);

  const handleConfirm = useCallback(async () => {
    await chrome.runtime.sendMessage({
      type: 'pageDecode',
      name: 'start',
    });
  }, []);

  useAutoStartWhenReady(isReadyFetch, handleConfirm, setters);

  return (
    <div className={`pado-extension-card ${status}`}>
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
  );
}

export default PadoCard;
