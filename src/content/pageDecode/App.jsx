import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import CelebrationStars from './CelebrationStars';
import {
  useAttestationStatus,
  useMessageListener,
  useTimeoutManager,
  useAutoStartWhenReady,
  useCountdown,
} from './hooks';
import {
  CONTAINER_ID,
  EXTENSION_VERSION,
  PAGE_DECODE_BLACK_MODAL_TEMPLATE_ID,
  STATUS,
  TIMING,
} from './constants';

const MODAL_CARD_WIDTH = 294;

function PrimusLogoRound() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="52" height="52" rx="26" fill="#FD4C00" />
      <g clipPath="url(#primus-logo-clip)">
        <rect
          width="32"
          height="32"
          transform="translate(10 10)"
          fill="white"
        />
        <path
          d="M40.5137 6.85254H11.6613C9.01113 6.85254 6.85254 9.01113 6.85254 11.6613V40.5137C6.85254 43.1639 9.01113 45.3225 11.6613 45.3225H40.5137C43.1639 45.3225 45.3225 43.1639 45.3225 40.5137V11.6613C45.3225 9.01113 43.1639 6.85254 40.5137 6.85254ZM17.4318 37.6285V39.0818C17.4318 39.8726 16.7906 40.5351 15.9785 40.5351H13.0932C12.3024 40.5351 11.6399 39.8939 11.6399 39.0818V36.1966C11.6399 35.4058 12.2811 34.7432 13.0932 34.7432H14.5465C15.8716 34.7432 16.7479 34.1448 17.1539 33.8029C17.1539 33.8029 20.5521 30.4902 20.9368 30.02C21.1933 29.7208 21.7062 29.272 21.7062 26.0448C21.7062 22.8176 23.6511 21.7276 26.0234 21.7276C28.3957 21.7276 30.3406 23.6725 30.3406 26.0448C30.3406 28.4171 28.3102 30.3619 26.0234 30.3619C23.7366 30.3619 22.9458 30.4474 22.1978 31.1741L18.5859 34.786C18.5859 34.786 17.4104 35.8546 17.4104 37.6071H17.4318V37.6285ZM40.5137 37.6285C40.5137 39.2314 39.21 40.5137 37.6285 40.5137H20.317V37.6285C20.317 36.0256 21.5993 34.7432 23.2023 34.7432H34.7432V17.4318H17.4318C15.8289 17.4318 14.5465 16.1494 14.5465 14.5465V11.6613H37.6285C39.2314 11.6613 40.5137 12.965 40.5137 14.5465V37.6285Z"
          fill="#FD4C00"
        />
      </g>
      <defs>
        <clipPath id="primus-logo-clip">
          <rect
            width="32"
            height="32"
            fill="white"
            transform="translate(10 10)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Arc via stroke + dasharray: undrawn segment is transparent. Align with StaticRing r=36. */
function LoadingStrokeVector() {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const arcDeg = 330;
  const gapDeg = 30;
  const dashLen = (arcDeg / 360) * circumference;
  const gapLen = (gapDeg / 360) * circumference;
  return (
    <svg
      width="77"
      height="77"
      viewBox="0 0 77 77"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="38.5"
        cy="38.5"
        r={r}
        fill="none"
        stroke="#FE985C"
        strokeWidth="3.67"
        strokeLinecap="round"
        strokeDasharray={`${dashLen} ${gapLen}`}
        transform="rotate(-90 38.5 38.5)"
      />
    </svg>
  );
}

function SuccessBadge() {
  return (
    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
      <path
        d="M1 3L3 5L7 1"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorBadge() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path
        d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StaticRing() {
  return (
    <svg className="ring-bg" width="77" height="77" viewBox="0 0 77 77">
      <circle
        cx="38.5"
        cy="38.5"
        r="36"
        fill="none"
        stroke="#FEE2D5"
        strokeWidth="3.67"
      />
    </svg>
  );
}

function SolidRing() {
  return (
    <svg className="result-ring" width="77" height="77" viewBox="0 0 77 77">
      <circle
        cx="38.5"
        cy="38.5"
        r="36"
        fill="none"
        stroke="#FE985C"
        strokeWidth="3.67"
      />
    </svg>
  );
}

function PadoCard({ activeRequest }) {
  const pageDecodeTemplateId =
    activeRequest?.attTemplateID ?? activeRequest?.id ?? null;

  useLayoutEffect(() => {
    const root = document.getElementById(CONTAINER_ID);
    if (!root) return undefined;
    const blackModal =
      pageDecodeTemplateId === PAGE_DECODE_BLACK_MODAL_TEMPLATE_ID;
    if (blackModal) root.classList.add('pado-page-decode-theme--black');
    else root.classList.remove('pado-page-decode-theme--black');
    return () => root.classList.remove('pado-page-decode-theme--black');
  }, [pageDecodeTemplateId]);

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

  // --- Drag logic ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const groupRef = useRef(null);
  const rootRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    const group = groupRef.current;
    const root = rootRef.current;
    if (!group || !root) return;
    const rootRect = root.getBoundingClientRect();
    const groupRect = group.getBoundingClientRect();
    setIsDragging(true);
    if (!hasDragged) {
      setHasDragged(true);
      setPosition({
        x: groupRect.left - rootRect.left,
        y: groupRect.top - rootRect.top,
      });
    }
    setDragStart({
      x: e.clientX - groupRect.left,
      y: e.clientY - groupRect.top,
    });
  }, [hasDragged]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const root = rootRef.current;
      const group = groupRef.current;
      if (!root || !group) return;
      const rootRect = root.getBoundingClientRect();
      const w = group.offsetWidth || MODAL_CARD_WIDTH;
      const h = group.offsetHeight || 400;
      const maxX = Math.max(0, rootRect.width - w);
      const maxY = Math.max(0, rootRect.height - h);
      let x = e.clientX - rootRect.left - dragStart.x;
      let y = e.clientY - rootRect.top - dragStart.y;
      x = Math.min(Math.max(0, x), maxX);
      y = Math.min(Math.max(0, y), maxY);
      setPosition({ x, y });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const isLoading = [
    STATUS.UNINITIALIZED,
    STATUS.INITIALIZED,
    STATUS.VERIFYING,
  ].includes(status);
  const isResult = status === STATUS.RESULT;
  const isSuccess = isResult && resultStatus === 'success';
  const isError = isResult && !isSuccess;

  const resultCountdownSeconds =
    status !== STATUS.RESULT
      ? TIMING.COUNTDOWN_SECONDS_SUCCESS
      : isSuccess
        ? TIMING.COUNTDOWN_SECONDS_SUCCESS
        : TIMING.COUNTDOWN_SECONDS_ERROR;

  const countdown = useCountdown(status, resultCountdownSeconds, handleBack);

  const targetItem =
    activeRequest?.verificationContent ??
    activeRequest?.verificationValue ??
    '';

  let title = 'Data Verification';
  let subtitle = 'Processing request...';
  let errorMsg = null;

  if (status === STATUS.INITIALIZED) {
    subtitle = 'Confirming login and account details...';
  } else if (status === STATUS.VERIFYING) {
    subtitle = `Verifying ${targetItem}...`;
  } else if (isSuccess) {
    title = 'Verified!';
    subtitle = `Task complete. Redirecting in ${countdown}s`;
  } else if (isError) {
    title = 'Verification Failed';
    errorMsg = errorTxt?.sourcePageTip || 'No verifiable data was detected.';
    const errorCode = errorTxt?.code || '';
    subtitle = errorCode
      ? `Error code: ${errorCode}. Redirecting in ${countdown}s`
      : `Redirecting in ${countdown}s`;
  }

  const groupClassName = `pado-modal-group${hasDragged ? ' pado-modal-group--dragging' : ''}`;
  const groupStyle = hasDragged
    ? { left: position.x, top: position.y }
    : undefined;

  return (
    <div className="pado-extension-shell">
      {/* 暂时关闭蒙层 */}
      {/* <div className="pado-modal-backdrop" aria-hidden="true" /> */}
      <div className="pado-extension-root" ref={rootRef}>
        <div
          ref={groupRef}
          className={groupClassName}
          style={groupStyle}
        >
          {isSuccess ? (
            <CelebrationStars
              key="celebration-stars"
              countdown={countdown}
            />
          ) : null}
          <div
            ref={modalRef}
            className="pado-modal-card"
            onMouseDown={handleMouseDown}
          >
            <div className="modal-drag-handle">
              <div className="handle-dots">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            </div>

            <div className="logo-ring-container">
              <div className="logo-ring">
                {/* No track under loading: gap in dash arc must show card bg, not #FEE2D5 */}
                {!isLoading && <StaticRing />}
                {isLoading && (
                  <div className="loading-ring">
                    <LoadingStrokeVector />
                  </div>
                )}
                {isResult && <SolidRing />}
                <div className="logo-center">
                  <PrimusLogoRound />
                </div>
                {isSuccess && (
                  <div className="result-badge success">
                    <SuccessBadge />
                  </div>
                )}
                {isError && (
                  <div className="result-badge error">
                    <ErrorBadge />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-text-content">
              <p className="modal-title">{title}</p>
              {errorMsg && <p className="modal-error-text">{errorMsg}</p>}
              <p className="modal-subtitle">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PadoCard;
