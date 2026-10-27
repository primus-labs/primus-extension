/**
 * Page decode content script entry: inject container, send initCompleted, render PadoCard on append.
 * Reuses a single React root to avoid repeated createRoot/unmount and listener churn.
 */
import React from 'react';
import { flushSync } from 'react-dom';
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
  DISABLED_GITHUB_TWO_FACTOR_URL_REGEX,
  DISABLED_LINKEDIN_MFA_URL_REGEX,
  DISABLED_OPENAI_MFA_URL_REGEX,
  DISABLED_X_MFA_URL_REGEX,
  STATUS,
  SESSION_KEYS,
} from './constants';
import './index.scss';
import { tryGithubRepositoriesShowMoreClick } from './pageDecodeGithubShowMore';
import { shouldDeferModalUntilFirstCapture } from '@/pages/Background/pageDecode/specialTemplates/discordInvite/templateId.js';

let activeRequest = null;
/** Discord invite: hide verification card until first configured request is captured. */
let deferredModalPending = false;
let rootRef = null;
let historyLocationListenerInstalled = false;
/** Polling id: content scripts run in an isolated world, so patching history.* may not see the page's navigations. */
let hrefPollIntervalId = null;
let lastPolledHref = '';
const PAGE_DECODE_SYNC_EVENT = 'pado-page-decode-sync';
let pageDecodeStateSyncInFlight = false;
/** One-shot follow-up pulls after inject: avoids 1s polling while tolerating delayed ready. */
const deferredPageDecodeSyncTimeouts = [];

/** Serializes mount/unmount/render so host SPA DOM churn cannot race React commit (removeChild NotFoundError). */
let pageDecodeUiChain = Promise.resolve();

function enqueuePageDecodeUi(syncTask) {
  pageDecodeUiChain = pageDecodeUiChain
    .then(() => {
      syncTask();
    })
    .catch((e) => {
      console.warn('[pageDecode] UI queue task failed', e);
    });
}

/** After root.unmount(), defer physical removal so React finishes internal detach first. */
function deferRemoveDomNode(node) {
  if (!node) return;
  queueMicrotask(() => {
    requestAnimationFrame(() => {
      try {
        if (node.isConnected) node.remove();
      } catch (_e) {
        /* ignore */
      }
    });
  });
}

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

function shouldDeferModalForAppend(response, templateParams) {
  if (response?.resultSnapshot || response?.phase === 'attesting') {
    return false;
  }
  if (!shouldDeferModalUntilFirstCapture(templateParams)) {
    return false;
  }
  return !response?.firstTemplateRequestCaptured;
}

function releaseDeferredModalIfPending() {
  if (!deferredModalPending) return;
  deferredModalPending = false;
  scheduleRenderPageDecodeCardIfAllowed();
}

function maybeReleaseDeferredModalFromAppend(response, templateParams) {
  if (!deferredModalPending) return;
  if (shouldDeferModalForAppend(response, templateParams)) return;
  releaseDeferredModalIfPending();
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
      maybeReleaseDeferredModalFromAppend(response, activeRequest);
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
    DISABLED_X_FLOW_URL_REGEX.test(href) ||
    DISABLED_GITHUB_TWO_FACTOR_URL_REGEX.test(href) ||
    DISABLED_LINKEDIN_MFA_URL_REGEX.test(href) ||
    DISABLED_OPENAI_MFA_URL_REGEX.test(href) ||
    DISABLED_X_MFA_URL_REGEX.test(href)
  );
}

function hidePageDecodeUi() {
  const container = document.getElementById(CONTAINER_ID);
  try {
    if (rootRef) {
      rootRef.unmount();
    }
  } catch (_e) {
    /* ignore */
  }
  rootRef = null;
  deferRemoveDomNode(container);
}

/**
 * Show PadoCard when there is an active attestation and the URL is not a disabled path;
 * otherwise unmount and remove the container (e.g. SPA navigated to /login).
 * Runs inside enqueuePageDecodeUi — do not call directly from async entrypoints.
 */
function renderPageDecodeCardIfAllowedInner() {
  if (!activeRequest) {
    return;
  }
  if (deferredModalPending) {
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
  flushSync(() => {
    rootRef.render(<PadoCard activeRequest={activeRequest} />);
  });
}

function scheduleRenderPageDecodeCardIfAllowed() {
  enqueuePageDecodeUi(() => renderPageDecodeCardIfAllowedInner());
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
      scheduleRenderPageDecodeCardIfAllowed();
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
      scheduleRenderPageDecodeCardIfAllowed();
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
    deferRemoveDomNode(container);
  }
  container = createDomElement(`<div id="${CONTAINER_ID}"></div>`);
  document.body.appendChild(container);
  return container;
}

function applyInitCompletedAppend(response) {
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
    if (!response.isReady && response.phase !== 'attesting') {
      tryGithubRepositoriesShowMoreClick(activeRequest);
    }
    maybeReleaseDeferredModalFromAppend(response, activeRequest);
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

  tryGithubRepositoriesShowMoreClick(activeRequest);

  deferredModalPending = shouldDeferModalForAppend(response, activeRequest);

  installHistoryLocationListener();
  startHrefPollingWhileAttestationActive();
  if (!deferredModalPending) {
    scheduleRenderPageDecodeCardIfAllowed();
  }
  clearDeferredPageDecodeSyncs();
  if (!response.isReady) {
    scheduleDeferredPageDecodeSync(400);
    scheduleDeferredPageDecodeSync(1600);
  }
}

ensurePageDecodeContainer();

chrome.runtime.onMessage.addListener((message) => {
  if (
    message?.type !== 'pageDecode' ||
    message?.name !== 'firstTemplateRequestCaptured'
  ) {
    return;
  }
  if (!activeRequest || !deferredModalPending) return;
  releaseDeferredModalIfPending();
});

chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'initCompleted',
  },
  applyInitCompletedAppend
);

installHistoryLocationListener();

// Defer font load to avoid blocking first paint
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => injectFont(), { timeout: 500 });
} else {
  setTimeout(injectFont, 0);
}
