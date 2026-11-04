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
  DISABLED_HYPERLIQUID_JOIN_URL_REGEX,
  DISABLED_FOMO_REFERRAL_URL_REGEX,
  STATUS,
  SESSION_KEYS,
} from './constants';
import './index.scss';
import { tryGithubRepositoriesShowMoreClick } from './pageDecodeGithubShowMore';
import { shouldDeferModalUntilFirstCapture } from '@/pages/Background/pageDecode/specialTemplates/discordInvite/templateId.js';
import {
  matches as matchesGoogleEmailTemplate,
  logGoogleEmail,
} from '@/pages/Background/pageDecode/specialTemplates/specialTemplateGoogleEmail.js';
import { PAGE_DECODE_BOOT_GLOBAL } from '@/pages/Background/pageDecode/pageDecodeInject.js';
import {
  startPolymarketLoginFormPoll,
  stopPolymarketLoginFormPoll,
  POLYMARKET_HIDE_MODAL_FOR_PROFILE_EVENT,
} from './polymarketProfileLoginPoll';
import {
  startHyperliquidJoinReferralWait,
  stopHyperliquidJoinReferralWait,
} from './hyperliquidJoinReferralWait';
let activeRequest = null;
/** Discord invite: hide verification card until first configured request is captured. */
let deferredModalPending = false;
let rootRef = null;
let historyLocationListenerInstalled = false;
/** Polling id: content scripts run in an isolated world, so patching history.* may not see the page's navigations. */
let hrefPollIntervalId = null;
let lastPolledHref = '';
const PAGE_DECODE_SYNC_EVENT = 'pado-page-decode-sync';
const POLYMARKET_PROFILE_HIDDEN_CLASS = 'pado-page-decode-modal--profile-hidden';
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

/** Sync VERIFYING UI when background already started attestation. */
function applyAttestingPhaseToSessionAndUi(phase) {
  const lastStatus = sessionStorage.getItem(SESSION_KEYS.STATUS);
  if (lastStatus === STATUS.RESULT) return;
  sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.VERIFYING);
  dispatchPageDecodeSyncEvent({
    isReady: true,
    phase: phase || 'attesting',
  });
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

function mergePolymarketGateUiFields(source) {
  if (!source || !activeRequest) return;
  if (source.polymarketProfileGateHolding != null) {
    activeRequest.polymarketProfileGateHolding =
      source.polymarketProfileGateHolding;
  }
  if (source.polymarketShowVerifyingSubtitle != null) {
    activeRequest.polymarketShowVerifyingSubtitle =
      source.polymarketShowVerifyingSubtitle;
  }
  if (source.polymarketGateAwaitingProfile != null) {
    activeRequest.polymarketGateAwaitingProfile =
      source.polymarketGateAwaitingProfile;
  }
  if (source.polymarketHideDataVerificationModal != null) {
    activeRequest.polymarketHideDataVerificationModal =
      source.polymarketHideDataVerificationModal;
  }
  if (source.phase != null) {
    activeRequest.pageDecodePhase = source.phase;
  }
}

function logGoogleEmailUi(event, detail = {}, templateHint) {
  const template = templateHint ?? activeRequest;
  if (!matchesGoogleEmailTemplate(template)) return;
  logGoogleEmail(`ui:${event}`, {
    href: window.location.href,
    sessionReady: sessionStorage.getItem(SESSION_KEYS.READY),
    sessionStatus: sessionStorage.getItem(SESSION_KEYS.STATUS),
    pageDecodePhase: activeRequest?.pageDecodePhase,
    ...detail,
  });
}

/**
 * Background requests captured; sync READY to session + mounted App (survives late PadoCard mount).
 * @param {{ isReady?: boolean; phase?: string }} source
 * @param {{ postRenderSync?: boolean; skipRender?: boolean }} [options]
 */
function applyPageDecodeReadyFromBackground(source, options = {}) {
  if (source?.phase === 'attesting') {
    logGoogleEmailUi('readySyncAttesting', { source, options });
    if (activeRequest) {
      activeRequest.pageDecodePhase = 'attesting';
    }
    sessionStorage.setItem(SESSION_KEYS.READY, '1');
    applyAttestingPhaseToSessionAndUi(source.phase);
    scheduleRenderPageDecodeCardIfAllowed();
    return;
  }
  if (!source?.isReady) {
    logGoogleEmailUi('readySyncSkipped', { source, options });
    return;
  }
  logGoogleEmailUi('readySyncApply', { source, options });
  const lastStatus = sessionStorage.getItem(SESSION_KEYS.STATUS);
  if (lastStatus === STATUS.RESULT) return;

  sessionStorage.setItem(SESSION_KEYS.READY, '1');
  if (activeRequest) {
    activeRequest.polymarketProfileGateHolding = false;
    activeRequest.polymarketShowVerifyingSubtitle = false;
    if (source.phase != null) {
      activeRequest.pageDecodePhase = source.phase;
    }
  }
  const phase = source.phase || activeRequest?.pageDecodePhase;
  dispatchPageDecodeSyncEvent({ isReady: true, phase });
  if (options.postRenderSync !== false) {
    enqueuePageDecodeUi(() => {
      dispatchPageDecodeSyncEvent({ isReady: true, phase });
    });
  }
  if (!options.skipRender) {
    scheduleRenderPageDecodeCardIfAllowed();
  }
  if (activeRequest) {
    enqueuePageDecodeUi(() => {
      maybeAutoStartAttestationFromContent();
    });
  }
}

/** When modal becomes visible again after gate release, sync ready without remounting App. */
function applyPolymarketGateReadyResume(source) {
  if (!source || !activeRequest) return;
  if (source.polymarketHideDataVerificationModal === true) return;
  applyPageDecodeReadyFromBackground(source, {
    postRenderSync: false,
    skipRender: true,
  });
}

/** @deprecated alias — background sends pageDecodeReadyUiSync for all templates */
function applyLinkedInNomadReadyUiSync(source) {
  applyPageDecodeReadyFromBackground(source);
}

/**
 * @param {boolean} isReady
 * @param {string | undefined} phase
 * @param {{ allowClearReady?: boolean }} [options] — only cold-start append should clear READY
 */
function applySessionReadyFromAppend(isReady, phase, options = {}) {
  if (isReady) {
    sessionStorage.setItem(SESSION_KEYS.READY, '1');
    return;
  }
  if (phase === 'ready' || phase === 'attesting') {
    return;
  }
  if (options.allowClearReady === true) {
    sessionStorage.removeItem(SESSION_KEYS.READY);
  }
}

/** Content-level auto-start when background is ready but React missed the sync event. */
function maybeAutoStartAttestationFromContent() {
  if (!activeRequest) {
    logGoogleEmailUi('autoStartSkipped', { reason: 'noActiveRequest' });
    return;
  }
  if (sessionStorage.getItem(SESSION_KEYS.READY) !== '1') {
    logGoogleEmailUi('autoStartSkipped', { reason: 'sessionNotReady' });
    return;
  }

  const lastStatus = sessionStorage.getItem(SESSION_KEYS.STATUS);
  if (lastStatus === STATUS.RESULT) {
    logGoogleEmailUi('autoStartSkipped', { reason: 'alreadyResult', lastStatus });
    return;
  }
  if (
    activeRequest.pageDecodePhase === 'attesting' ||
    lastStatus === STATUS.VERIFYING
  ) {
    logGoogleEmailUi('autoStartSkipped', {
      reason: 'alreadyAttestingOrVerifying',
      phase: activeRequest.pageDecodePhase,
      lastStatus,
    });
    return;
  }

  logGoogleEmailUi('autoStartSendStart', {});
  sessionStorage.setItem(SESSION_KEYS.STATUS, STATUS.VERIFYING);
  dispatchPageDecodeSyncEvent({
    isReady: true,
    phase: activeRequest.pageDecodePhase || 'ready',
  });
  chrome.runtime.sendMessage({
    type: 'pageDecode',
    name: 'start',
  });
}

function scheduleReadyFollowUpSyncs(isReady) {
  clearDeferredPageDecodeSyncs();
  scheduleDeferredPageDecodeSync(400);
  scheduleDeferredPageDecodeSync(1600);
  if (isReady) {
    scheduleDeferredPageDecodeSync(80);
    scheduleDeferredPageDecodeSync(320);
  }
}

function setPolymarketModalVisuallyHidden(hidden) {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;
  container.classList.toggle(POLYMARKET_PROFILE_HIDDEN_CLASS, !!hidden);
}

function syncPolymarketLoginFormPoll(response, templateParams) {
  if (response?.isReady) {
    stopPolymarketLoginFormPoll();
    return;
  }
  if (
    response?.polymarketFormProbeActive &&
    response.polymarketFormProbeStartedAt != null
  ) {
    startPolymarketLoginFormPoll(
      templateParams,
      response.polymarketFormProbeActive,
      response.polymarketFormProbeStartedAt,
      response.polymarketFormProbeDurationMs
    );
    return;
  }
  stopPolymarketLoginFormPoll();
}

function syncHyperliquidJoinReferralWait(response, templateParams) {
  if (
    response?.isReady ||
    response?.phase === 'attesting' ||
    response?.resultSnapshot
  ) {
    stopHyperliquidJoinReferralWait();
    return;
  }
  if (templateParams) {
    startHyperliquidJoinReferralWait(templateParams);
    return;
  }
  stopHyperliquidJoinReferralWait();
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
      syncPolymarketLoginFormPoll(response, activeRequest);
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
  if (
    isDisabledPath() ||
    DISABLED_HYPERLIQUID_JOIN_URL_REGEX.test(window.location.href.toLowerCase()) ||
    DISABLED_FOMO_REFERRAL_URL_REGEX.test(window.location.href.toLowerCase())
  ) {
    hidePageDecodeUi();
    return;
  }
  const polymarketHide =
    activeRequest.polymarketHideDataVerificationModal === true;
  if (polymarketHide && !rootRef) {
    return;
  }
  const container = ensurePageDecodeContainer();
  if (!rootRef) {
    rootRef = createRoot(container);
  }
  setPolymarketModalVisuallyHidden(polymarketHide);
  flushSync(() => {
    rootRef.render(<PadoCard activeRequest={activeRequest} />);
  });
  if (sessionStorage.getItem(SESSION_KEYS.READY) === '1') {
    queueMicrotask(() => {
      dispatchPageDecodeSyncEvent({
        isReady: true,
        phase: activeRequest?.pageDecodePhase,
      });
      maybeAutoStartAttestationFromContent();
    });
  }
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

  const hadActiveRequest = !!activeRequest;
  logGoogleEmailUi(
    'appendReceived',
    {
      isReady: !!response.isReady,
      phase: response.phase,
      hadActiveRequest,
      dataSourcePageTabId: response.dataSourcePageTabId,
      templateTabId: response.params?.tabId,
    },
    hadActiveRequest ? activeRequest : response.params
  );

  if (response.resultSnapshot) {
    applyResultSnapshotToSession(response.resultSnapshot);
  } else if (!hadActiveRequest) {
    clearPersistedResultState();
  }

  applySessionReadyFromAppend(!!response.isReady, response.phase, {
    allowClearReady: !hadActiveRequest,
  });
  if (!response.resultSnapshot && response.phase === 'attesting') {
    if (activeRequest) {
      activeRequest.pageDecodePhase = 'attesting';
    }
    applyAttestingPhaseToSessionAndUi(response.phase);
  }

  if (activeRequest) {
    activeRequest.pageDecodePhase = response.phase || activeRequest.pageDecodePhase;
    activeRequest.resultSnapshot = response.resultSnapshot || null;
    mergePolymarketGateUiFields(response);
    syncPolymarketLoginFormPoll(response, activeRequest);
    syncHyperliquidJoinReferralWait(response, activeRequest);
    if (!response.isReady && response.phase !== 'attesting') {
      tryGithubRepositoriesShowMoreClick(activeRequest);
    }
    maybeReleaseDeferredModalFromAppend(response, activeRequest);
    scheduleRenderPageDecodeCardIfAllowed();
    dispatchPageDecodeSyncEvent({
      isReady: !!response.isReady,
      phase: response.phase || activeRequest.pageDecodePhase,
      resultSnapshot: response.resultSnapshot || null,
    });
    if (response.isReady) {
      applyPageDecodeReadyFromBackground(
        { isReady: true, phase: response.phase },
        { postRenderSync: true, skipRender: true }
      );
    } else if (sessionStorage.getItem(SESSION_KEYS.READY) === '1') {
      enqueuePageDecodeUi(() => {
        maybeAutoStartAttestationFromContent();
      });
    }
    scheduleReadyFollowUpSyncs(!!response.isReady);
    return;
  }

  const params = response.params || {};
  activeRequest = { ...params };
  activeRequest.pageDecodePhase = response.phase || params.pageDecodePhase;
  activeRequest.resultSnapshot = response.resultSnapshot || params.resultSnapshot || null;
  activeRequest.polymarketProfileGateHolding =
    response.polymarketProfileGateHolding ?? false;
  activeRequest.polymarketShowVerifyingSubtitle =
    response.polymarketShowVerifyingSubtitle ?? false;
  activeRequest.polymarketGateAwaitingProfile =
    response.polymarketGateAwaitingProfile ?? false;
  activeRequest.polymarketHideDataVerificationModal =
    response.polymarketHideDataVerificationModal ?? false;
  delete activeRequest.PADOSERVERURL;
  delete activeRequest.padoExtensionVersion;

  tryGithubRepositoriesShowMoreClick(activeRequest);
  syncPolymarketLoginFormPoll(response, activeRequest);
  syncHyperliquidJoinReferralWait(response, activeRequest);

  deferredModalPending = shouldDeferModalForAppend(response, activeRequest);

  installHistoryLocationListener();
  startHrefPollingWhileAttestationActive();
  if (!deferredModalPending) {
    scheduleRenderPageDecodeCardIfAllowed();
  }
  dispatchPageDecodeSyncEvent({
    isReady: !!response.isReady,
    phase: response.phase || activeRequest.pageDecodePhase,
    resultSnapshot: response.resultSnapshot || null,
  });
  if (response.isReady) {
    applyPageDecodeReadyFromBackground(
      { isReady: true, phase: response.phase },
      { postRenderSync: true, skipRender: true }
    );
  }
  scheduleReadyFollowUpSyncs(!!response.isReady);
}

if (globalThis[PAGE_DECODE_BOOT_GLOBAL]) {
  // Duplicate bundle injection in the same document — skip listeners and initCompleted.
} else {
  globalThis[PAGE_DECODE_BOOT_GLOBAL] = true;

ensurePageDecodeContainer();

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'pageDecode') return;

  if (message.name === 'firstTemplateRequestCaptured') {
    if (!activeRequest || !deferredModalPending) return;
    releaseDeferredModalIfPending();
    return;
  }

  if (message.name === 'polymarketFormProbeStarted') {
    if (!activeRequest) return;
    syncPolymarketLoginFormPoll(
      {
        isReady: false,
        polymarketFormProbeActive: true,
        polymarketFormProbeStartedAt: message.formProbeStartedAt,
        polymarketFormProbeDurationMs: message.formProbeDurationMs,
      },
      activeRequest
    );
    return;
  }

  if (message.name === 'polymarketGateUiSync') {
    if (!activeRequest) return;
    mergePolymarketGateUiFields(message);
    applyPolymarketGateReadyResume(message);
    scheduleRenderPageDecodeCardIfAllowed();
    return;
  }

  if (message.name === 'linkedInNomadUiSync' || message.name === 'pageDecodeReadyUiSync') {
    logGoogleEmailUi('message', { name: message.name, isReady: message.isReady });
    applyPageDecodeReadyFromBackground(message);
    return;
  }

  if (message.name === 'webRequestIsReady') {
    logGoogleEmailUi('message', { name: message.name });
    const phase = activeRequest?.pageDecodePhase;
    if (phase === 'attesting') {
      applyPageDecodeReadyFromBackground({ isReady: true, phase: 'attesting' });
    } else {
      applyPageDecodeReadyFromBackground({
        isReady: true,
        phase,
      });
    }
    return;
  }

  if (message.name === 'end') {
    applyEndFromBackground(message.params || {});
    return;
  }
});

/** Module-level end handler so result UI updates even if PadoCard was unmounted. */
function applyEndFromBackground(params) {
  const { result, failReason, closeAt } = params;
  const resultSnapshot = {
    result: result ?? '',
    failReason,
    closeAt,
  };
  applyResultSnapshotToSession(resultSnapshot);
  if (activeRequest) {
    activeRequest.resultSnapshot = resultSnapshot;
  }
  dispatchPageDecodeSyncEvent({ resultSnapshot });
  scheduleRenderPageDecodeCardIfAllowed();
}

chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'initCompleted',
  },
  applyInitCompletedAppend
);

installHistoryLocationListener();

window.addEventListener(POLYMARKET_HIDE_MODAL_FOR_PROFILE_EVENT, () => {
  if (!activeRequest) return;
  activeRequest.polymarketHideDataVerificationModal = true;
  scheduleRenderPageDecodeCardIfAllowed();
});

// Defer font load to avoid blocking first paint
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => injectFont(), { timeout: 500 });
} else {
  setTimeout(injectFont, 0);
}

}
