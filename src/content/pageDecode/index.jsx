/**
 * Page decode content script entry: inject container, send initCompleted, render PadoCard on append.
 * Reuses a single React root to avoid repeated createRoot/unmount and listener churn.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createDomElement } from './utils';
import PadoCard from './App';
import { injectFont } from './utils';
import {
  CONTAINER_ID,
  DISABLED_PATH_SEGMENT_REGEX,
  DISABLED_AMAZON_URL_REGEX,
  DISABLED_STEAM_URL_REGEX,
  DISABLED_NAVER_URL_REGEX,
  DISABLED_X_FLOW_URL_REGEX,
  STATUS,
  SESSION_KEYS,
} from './constants';
import './index.scss';

let activeRequest = null;
let rootRef = null;
let historyLocationListenerInstalled = false;
/** Polling id: content scripts run in an isolated world, so patching history.* may not see the page's navigations. */
let hrefPollIntervalId = null;
let lastPolledHref = '';
const PAGE_DECODE_SYNC_EVENT = 'pado-page-decode-sync';
let pageDecodeStateSyncInFlight = false;
/** One-shot follow-up pulls after inject: avoids 1s polling while tolerating delayed ready. */
const deferredPageDecodeSyncTimeouts = [];

function dispatchPageDecodeSyncEvent(detail) {
  window.dispatchEvent(
    new CustomEvent(PAGE_DECODE_SYNC_EVENT, {
      detail,
    })
  );
}

function clearDeferredPageDecodeSyncs() {
  deferredPageDecodeSyncTimeouts.forEach((id) => clearTimeout(id));
  deferredPageDecodeSyncTimeouts.length = 0;
}

function scheduleDeferredPageDecodeSync(delayMs) {
  const id = setTimeout(() => {
    const i = deferredPageDecodeSyncTimeouts.indexOf(id);
    if (i >= 0) deferredPageDecodeSyncTimeouts.splice(i, 1);
    syncPageDecodeStateOnce();
  }, delayMs);
  deferredPageDecodeSyncTimeouts.push(id);
}

function syncPageDecodeStateOnce() {
  if (!activeRequest || pageDecodeStateSyncInFlight) return;
  pageDecodeStateSyncInFlight = true;
  chrome.runtime.sendMessage(
    {
      type: 'pageDecode',
      name: 'initCompleted',
    },
    (response) => {
      pageDecodeStateSyncInFlight = false;
      if (chrome.runtime.lastError) {
        return;
      }
      if (!response || response.name !== 'append') return;
      if (
        response.isReady ||
        response.phase === 'attesting' ||
        response.resultSnapshot
      ) {
        dispatchPageDecodeSyncEvent({
          isReady: !!response.isReady,
          phase: response.phase || activeRequest?.pageDecodePhase,
          resultSnapshot: response.resultSnapshot || null,
        });
      }
    }
  );
}

function clearPersistedResultState() {
  sessionStorage.removeItem(SESSION_KEYS.STATUS);
  sessionStorage.removeItem(SESSION_KEYS.RESULT_STATUS);
  sessionStorage.removeItem(SESSION_KEYS.ERROR_TXT);
  sessionStorage.removeItem(SESSION_KEYS.RESULT_CLOSE_AT);
}

function applyResultSnapshotToSession(resultSnapshot) {
  clearPersistedResultState();
  sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.RESULT);
  sessionStorage.setItem(
    SESSION_KEYS.RESULT_STATUS,
    resultSnapshot?.result || ''
  );
  sessionStorage.setItem(
    SESSION_KEYS.RESULT_CLOSE_AT,
    String(resultSnapshot?.closeAt || '')
  );
  if (resultSnapshot?.failReason != null) {
    sessionStorage.setItem(
      SESSION_KEYS.ERROR_TXT,
      JSON.stringify(resultSnapshot.failReason)
    );
  }
}

function isDisabledPath() {
  const href = window.location.href.toLowerCase();
  return (
    DISABLED_PATH_SEGMENT_REGEX.test(href) ||
    DISABLED_AMAZON_URL_REGEX.test(href) ||
    DISABLED_STEAM_URL_REGEX.test(href) ||
    DISABLED_NAVER_URL_REGEX.test(href) ||
    DISABLED_X_FLOW_URL_REGEX.test(href)
  );
}

function hidePageDecodeUi() {
  try {
    if (rootRef) {
      rootRef.unmount();
    }
  } catch (_e) {
    /* ignore */
  }
  rootRef = null;
  const container = document.getElementById(CONTAINER_ID);
  if (container) {
    try {
      container.remove();
    } catch (_e) {
      /* ignore */
    }
  }
}

/**
 * Show PadoCard when there is an active attestation and the URL is not a disabled path;
 * otherwise unmount and remove the container (e.g. SPA navigated to /login).
 */
function renderPageDecodeCardIfAllowed() {
  if (!activeRequest) {
    return;
  }
  if (isDisabledPath()) {
    hidePageDecodeUi();
    return;
  }
  const container = ensurePageDecodeContainer();
  if (!rootRef) {
    rootRef = createRoot(container);
  }
  rootRef.render(<PadoCard activeRequest={activeRequest} />);
}

function installHistoryLocationListener() {
  if (historyLocationListenerInstalled) {
    return;
  }
  historyLocationListenerInstalled = true;

  const onLocationMaybeChanged = () => {
    if (!activeRequest) {
      return;
    }
    lastPolledHref = window.location.href;
    queueMicrotask(() => {
      renderPageDecodeCardIfAllowed();
    });
  };

  const wrap = (original) =>
    function patchedHistoryMethod(...args) {
      const ret = original.apply(this, args);
      onLocationMaybeChanged();
      return ret;
    };

  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
  window.addEventListener('popstate', onLocationMaybeChanged);
  window.addEventListener('hashchange', onLocationMaybeChanged);
}

/**
 * Isolated-world history patches often miss SPA updates done in the page's JS realm.
 * Poll href while an attestation is active so /dashboard → /login still hides the card.
 */
function startHrefPollingWhileAttestationActive() {
  if (hrefPollIntervalId != null) {
    clearInterval(hrefPollIntervalId);
    hrefPollIntervalId = null;
  }
  if (!activeRequest) {
    lastPolledHref = '';
    return;
  }
  lastPolledHref = window.location.href;
  hrefPollIntervalId = setInterval(() => {
    if (!activeRequest) {
      clearInterval(hrefPollIntervalId);
      hrefPollIntervalId = null;
      lastPolledHref = '';
      return;
    }
    const href = window.location.href;
    if (href !== lastPolledHref) {
      lastPolledHref = href;
      renderPageDecodeCardIfAllowed();
    }
  }, 250);
}

/**
 * Host SPAs may replace body or remove injected nodes; React then crashes with
 * insertBefore NotFoundError. Re-create the mount node and reset the root.
 */
function ensurePageDecodeContainer() {
  let container = document.getElementById(CONTAINER_ID);
  if (container && document.body.contains(container)) {
    return container;
  }
  try {
    if (rootRef) {
      rootRef.unmount();
    }
  } catch (_e) {
    /* ignore */
  }
  rootRef = null;
  if (container && !document.body.contains(container)) {
    try {
      container.remove();
    } catch (_e) {
      /* ignore */
    }
  }
  container = createDomElement(`<div id="${CONTAINER_ID}"></div>`);
  document.body.appendChild(container);
  return container;
}

ensurePageDecodeContainer();

chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'initCompleted',
  },
  (response) => {
    if (!response || response.name !== 'append') return;
    if (isDisabledPath()) return;

    if (response.resultSnapshot) {
      applyResultSnapshotToSession(response.resultSnapshot);
    } else {
      clearPersistedResultState();
    }

    if (response.isReady) {
      sessionStorage.setItem(SESSION_KEYS.READY, '1');
    } else {
      sessionStorage.removeItem(SESSION_KEYS.READY);
    }
    if (!response.resultSnapshot && response.phase === 'attesting') {
      sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.VERIFYING);
    }

    if (activeRequest) {
      activeRequest.pageDecodePhase = response.phase || activeRequest.pageDecodePhase;
      activeRequest.resultSnapshot = response.resultSnapshot || null;
      dispatchPageDecodeSyncEvent({
        isReady: !!response.isReady,
        phase: response.phase || activeRequest.pageDecodePhase,
        resultSnapshot: response.resultSnapshot || null,
      });
      clearDeferredPageDecodeSyncs();
      if (!response.isReady) {
        scheduleDeferredPageDecodeSync(400);
        scheduleDeferredPageDecodeSync(1600);
      }
      return;
    }

    const params = response.params || {};
    activeRequest = { ...params };
    activeRequest.pageDecodePhase = response.phase || params.pageDecodePhase;
    activeRequest.resultSnapshot = response.resultSnapshot || params.resultSnapshot || null;
    delete activeRequest.PADOSERVERURL;
    delete activeRequest.padoExtensionVersion;

    installHistoryLocationListener();
    startHrefPollingWhileAttestationActive();
    renderPageDecodeCardIfAllowed();
    clearDeferredPageDecodeSyncs();
    if (!response.isReady) {
      scheduleDeferredPageDecodeSync(400);
      scheduleDeferredPageDecodeSync(1600);
    }
  }
);

installHistoryLocationListener();

// Defer font load to avoid blocking first paint
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => injectFont(), { timeout: 500 });
} else {
  setTimeout(injectFont, 0);
}
