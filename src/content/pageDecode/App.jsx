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
import { CONTAINER_ID, EXTENSION_VERSION, STATUS, TIMING } from './constants';
import { detectHostTheme } from './utils';
import { shouldUseDarkModalForDataSourceUrl } from '@/pages/Background/pageDecode/specialTemplates/dataSourceDarkModalOrigins';
import {
  getPageDecodeModalPlacement,
  getPageDecodeHostModalAnchor,
  shouldUseDarkModalForTemplate,
} from '@/pages/Background/pageDecode/specialTemplates/pageDecodePnlHooks';
import {
  findHostModalElement,
  computePositionBesideHostModal,
} from './hostModalAnchor';
import { DEFAULT_PRE_ATTEST_PROMPT_V2 } from '@/pages/Background/pageDecode/state';

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

/** Join `PRE_ATTEST_PROMOT_V2` item `text` with a fullwidth comma for one-line subtitle. */
function joinPreAttestPromotText(entry) {
  const parts = entry?.text;
  if (!Array.isArray(parts) || parts.length === 0) return '';
  return parts
    .map((s) => (s == null ? '' : String(s).trim()))
    .filter(Boolean)
    .join('，');
}

function PadoCard({ activeRequest }) {
  const dataSourceHref =
    typeof window !== 'undefined' ? window.location.href : '';
  const modalPlacement = getPageDecodeModalPlacement(activeRequest);
  const hostModalAnchor = getPageDecodeHostModalAnchor(activeRequest);
  const useHostModalAnchor = Boolean(hostModalAnchor);
  const rootPlacementClass =
    modalPlacement === 'bottomRight'
      ? ' pado-extension-root--bottom-right'
      : modalPlacement === 'centerRight'
        ? ' pado-extension-root--center-right'
        : useHostModalAnchor
          ? ' pado-extension-root--host-anchor'
          : '';

  useLayoutEffect(() => {
    const root = document.getElementById(CONTAINER_ID);
    if (!root) return undefined;
    const shouldForceBlackModal =
      shouldUseDarkModalForDataSourceUrl(dataSourceHref) ||
      shouldUseDarkModalForTemplate(activeRequest);
    const resolvedTheme = shouldForceBlackModal ? 'dark' : detectHostTheme();
    if (resolvedTheme === 'dark') {
      root.classList.add('pado-page-decode-theme--black');
    }
    else root.classList.remove('pado-page-decode-theme--black');
    return () => root.classList.remove('pado-page-decode-theme--black');
  }, [dataSourceHref, activeRequest]);

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
    resultCloseAt,
    setResultCloseAt,
  } = useAttestationStatus();

  const setters = useMemo(
    () => ({
      setStatus,
      setIsReadyFetch,
      setResultStatus,
      setErrorTxt,
      setResultCloseAt,
    }),
    [setStatus, setIsReadyFetch, setResultStatus, setErrorTxt, setResultCloseAt]
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

  useAutoStartWhenReady(
    isReadyFetch,
    handleConfirm,
    setters,
    activeRequest?.pageDecodePhase
  );

  // --- Drag / host-modal anchor ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [anchorPosition, setAnchorPosition] = useState(null);
  const [hasDragged, setHasDragged] = useState(false);
  const modalRef = useRef(null);
  const groupRef = useRef(null);
  const rootRef = useRef(null);
  const observedHostRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const updateDragPosition = useCallback((clientX, clientY) => {
    const root = rootRef.current;
    const group = groupRef.current;
    if (!root || !group) return;
    const rootRect = root.getBoundingClientRect();
    const w = group.offsetWidth || MODAL_CARD_WIDTH;
    const h = group.offsetHeight || 400;
    const maxX = Math.max(0, rootRect.width - w);
    const maxY = Math.max(0, rootRect.height - h);
    const { x: offsetX, y: offsetY } = dragStartRef.current;
    let x = clientX - rootRect.left - offsetX;
    let y = clientY - rootRect.top - offsetY;
    x = Math.min(Math.max(0, x), maxX);
    y = Math.min(Math.max(0, y), maxY);
    setPosition({ x, y });
  }, []);

  const endDrag = useCallback((pointerId) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const modal = modalRef.current;
    if (modal && pointerId != null) {
      try {
        if (modal.hasPointerCapture(pointerId)) {
          modal.releasePointerCapture(pointerId);
        }
      } catch {
        /* pointer already released */
      }
    }
  }, []);

  const handleModalPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const group = groupRef.current;
      const root = rootRef.current;
      const modal = modalRef.current;
      if (!group || !root || !modal) return;

      const rootRect = root.getBoundingClientRect();
      const groupRect = group.getBoundingClientRect();

      isDraggingRef.current = true;

      if (!hasDragged) {
        setHasDragged(true);
        setPosition({
          x: groupRect.left - rootRect.left,
          y: groupRect.top - rootRect.top,
        });
      }

      const start = {
        x: e.clientX - groupRect.left,
        y: e.clientY - groupRect.top,
      };
      dragStartRef.current = start;

      try {
        modal.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [hasDragged]
  );

  const handleModalPointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    updateDragPosition(e.clientX, e.clientY);
  }, [updateDragPosition]);

  const handleModalPointerUp = useCallback(
    (e) => {
      e.stopPropagation();
      endDrag(e.pointerId);
    },
    [endDrag]
  );

  const handleModalPointerCancel = useCallback(
    (e) => {
      e.stopPropagation();
      endDrag(e.pointerId);
    },
    [endDrag]
  );

  const handleModalClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

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

  const countdown = useCountdown(
    status,
    resultCountdownSeconds,
    resultCloseAt,
    handleBack
  );

  const targetItem =
    activeRequest?.verificationContent ??
    activeRequest?.verificationValue ??
    '';

  const promotV2 = activeRequest?.PRE_ATTEST_PROMOT_V2;
  const subtitleFromPromot0 =
    joinPreAttestPromotText(promotV2?.[0]) ||
    joinPreAttestPromotText(DEFAULT_PRE_ATTEST_PROMPT_V2[0]);
  const subtitleFromPromot1 =
    joinPreAttestPromotText(promotV2?.[1]) ||
    joinPreAttestPromotText(DEFAULT_PRE_ATTEST_PROMPT_V2[1]);

  let title = 'Data Verification';
  let subtitle = subtitleFromPromot0;
  let errorMsg = null;

  if (status === STATUS.INITIALIZED) {
    subtitle = subtitleFromPromot1;
  } else if (status === STATUS.VERIFYING) {
    subtitle = `Verifying ${targetItem}...`;
  } else if (isSuccess) {
    title = 'Verified!';
    subtitle = `Task complete. Redirecting in ${countdown}s`;
  } else if (isError) {
    title = 'Verification Failed';
    errorMsg = errorTxt?.sourcePageTip || 'No verifiable data was detected.';
    const errorCode = errorTxt?.code || '';
    const errorCodeForDisplay = errorCode.split(':')[0]?.trim() || errorCode;
    subtitle = errorCodeForDisplay
      ? `Error code: ${errorCodeForDisplay}. Redirecting in ${countdown}s`
      : `Redirecting in ${countdown}s`;
  }

  useLayoutEffect(() => {
    if (!useHostModalAnchor || hasDragged) {
      if (!useHostModalAnchor) setAnchorPosition(null);
      return undefined;
    }

    const updateAnchorPosition = () => {
      const root = rootRef.current;
      const group = groupRef.current;
      if (!root || !group) return;

      const host = findHostModalElement(hostModalAnchor, CONTAINER_ID);
      if (!host) {
        setAnchorPosition(null);
        observedHostRef.current = null;
        return;
      }

      if (host !== observedHostRef.current) {
        observedHostRef.current = host;
        resizeObserver.observe(host);
      }

      const next = computePositionBesideHostModal({
        root,
        group,
        host,
        gap: hostModalAnchor?.gap ?? 16,
        cardWidth: MODAL_CARD_WIDTH,
      });
      setAnchorPosition(next);
    };

    const resizeObserver = new ResizeObserver(updateAnchorPosition);
    resizeObserver.observe(document.documentElement);

    const mutationObserver = new MutationObserver(updateAnchorPosition);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'class', 'style'],
    });

    window.addEventListener('resize', updateAnchorPosition);

    updateAnchorPosition();

    let pollId = null;
    let pollAttempts = 0;
    const pollForHost = () => {
      if (pollAttempts >= 20) return;
      pollAttempts += 1;
      updateAnchorPosition();
      if (!findHostModalElement(hostModalAnchor, CONTAINER_ID)) {
        pollId = window.setTimeout(pollForHost, 100);
      }
    };
    pollForHost();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', updateAnchorPosition);
      if (pollId != null) clearTimeout(pollId);
      observedHostRef.current = null;
    };
  }, [
    useHostModalAnchor,
    hostModalAnchor,
    hasDragged,
    status,
    title,
    subtitle,
    errorMsg,
  ]);

  const isAnchored =
    useHostModalAnchor && anchorPosition && !hasDragged;
  const isAbsoluteGroup = hasDragged || isAnchored;
  const groupClassName = `pado-modal-group${
    isAbsoluteGroup ? ' pado-modal-group--anchored' : ''
  }`;
  const groupStyle = hasDragged
    ? { left: position.x, top: position.y }
    : isAnchored
      ? { left: anchorPosition.x, top: anchorPosition.y }
      : undefined;

  return (
    <div className="pado-extension-shell">
      {/* Backdrop overlay disabled for now */}
      {/* <div className="pado-modal-backdrop" aria-hidden="true" /> */}
      <div
        className={`pado-extension-root${rootPlacementClass}`}
        ref={rootRef}
      >
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
            onPointerDown={handleModalPointerDown}
            onPointerMove={handleModalPointerMove}
            onPointerUp={handleModalPointerUp}
            onPointerCancel={handleModalPointerCancel}
            onClick={handleModalClick}
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
                  <div className="result-badge result-badge--success">
                    <SuccessBadge />
                  </div>
                )}
                {isError && (
                  <div className="result-badge result-badge--error">
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
