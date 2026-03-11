/**
 * Page decode attestation card UI. Uses hooks for status, messages, and timeouts.
 */
import React, { useCallback } from 'react';
import RightEl from './RightEl';
import FooterEl from './FooterEl';
import HeaderEl from './HeaderEl';
import {
  useAttestationStatus,
  useMessageListener,
  useTimeoutManager,
  useAutoStartWhenReady,
} from './hooks';

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

  const settors = {
    setStatus,
    setIsReadyFetch,
    setResultStatus,
    setErrorTxt,
  };

  useMessageListener(settors);
  useTimeoutManager(activeRequest, status, statusRef, settors);

  const handleBack = useCallback(async () => {
    await chrome.runtime.sendMessage({
      type: 'pageDecode',
      name: 'close',
      params: {
        tabId: activeRequest?.tabId,
        extensionVersion: '0.3.27',
      },
    });
  }, [activeRequest?.tabId]);

  const handleConfirm = useCallback(async () => {
    await chrome.runtime.sendMessage({
      type: 'pageDecode',
      name: 'start',
    });
  }, []);

  useAutoStartWhenReady(isReadyFetch, handleConfirm, settors);

  return (
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
  );
}

export default PadoCard;
