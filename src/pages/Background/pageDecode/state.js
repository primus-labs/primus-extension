/* global chrome, clearTimeout */
/**
 * Centralized state for the page decode / attestation flow.
 * Replaces module-level mutable variables for testability and clear lifecycle.
 */
export const DEFAULT_PRE_ATTEST_PROMPT_V2 = [
  {
    text: ['Processing request...'],
    showTime: 5000,
  },
  {
    text: ['Confirming login and account details...'],
    showTime: 80000,
  },
];

export const PAGE_DECODE_PHASES = {
  IDLE: 'idle',
  CAPTURING: 'capturing',
  READY: 'ready',
  ATTESTING: 'attesting',
};

export function createPageDecodeState() {
  const state = {
    dataSourcePageTabId: null,
    activeTemplate: {},
    currExtentionId: null,
    isReadyRequest: false,
    phase: PAGE_DECODE_PHASES.IDLE,
    readyNotified: false,
    startHandled: false,
    operationType: null,
    formatAlgorithmParams: null,
    onBeforeSendHeadersFn: () => {},
    onBeforeRequestFn: () => {},
    tabUpdatedListener: null,
    tabRemovedListener: null,
    injectDebounceTimer: null,
    requestsMap: {},
    reportRequestIds: [],
    PRE_ATTEST_PROMOT_V2: [...DEFAULT_PRE_ATTEST_PROMPT_V2],
    /**
     * If true, the next data-source tab removal (e.g. chrome.tabs.remove) is treated as programmatic:
     * onRemoved skips handlerForSdk('cancel') so the DApp is not sent cancel/failure after a successful attestation.
     * Set by closeSdkDataSourceTabWithoutCancel before closing; cleared by the onRemoved listener after handling.
     */
    skipCancelOnNextDataSourceTabRemoved: false,
    /** Set for Amazon account-manage template: storefront base URL for jumpTo resolution */
    resolvedAmazonStorefrontBaseUrl: null,
    /** Final UI result snapshot for replay after a same-tab navigation/reload during countdown */
    uiResultSnapshot: null,
    /** Runtime for dataPageTemplate.jumpConfig multi-step redirects; see jumpConfigRedirect.js */
    jumpConfigState: null,
    /** Luma Monad template runtime context, written as a single object after target checks pass */
    monadFields: {},
    /** Reputation Phala Binance earn balance (031720f6): asset row index for response reveals */
    reputationPhalaBinanceEarnFields: {},
    /** Channel subscription / Twitch (515fd5af): MATCH_ONE jsonpath chosen from request body list */
    channelSubscriptionFields: {},
    /** Phala reputation CVM list: cvmIdList filled in checkTargetRequestFnForReputationPhalaCvmList */
    reputationPhalaFields: {},
    /** Luma paged approved (52167341): { pages: [{ url, hits: [{ entryIdx }] }] } */
    lumaPagedApprovedHits: null,
  };

  function resetMonadFields() {
    Object.keys(state.monadFields).forEach((k) => {
      delete state.monadFields[k];
    });
  }

  function setMonadFields(fields) {
    resetMonadFields();
    Object.assign(state.monadFields, fields || {});
    return state.monadFields;
  }

  function getMonadFields() {
    return state.monadFields;
  }

  function resetReputationPhalaFields() {
    Object.keys(state.reputationPhalaFields).forEach((k) => {
      delete state.reputationPhalaFields[k];
    });
  }

  function setReputationPhalaFields(fields) {
    resetReputationPhalaFields();
    Object.assign(state.reputationPhalaFields, fields || {});
    return state.reputationPhalaFields;
  }

  function getReputationPhalaFields() {
    return state.reputationPhalaFields;
  }

  function resetLumaPagedApprovedHits() {
    state.lumaPagedApprovedHits = null;
  }

  function setLumaPagedApprovedHits(payload) {
    state.lumaPagedApprovedHits =
      payload && typeof payload === 'object' ? { ...payload } : null;
    return state.lumaPagedApprovedHits;
  }

  function getLumaPagedApprovedHits() {
    return state.lumaPagedApprovedHits;
  }

  function resetReputationPhalaBinanceEarnFields() {
    Object.keys(state.reputationPhalaBinanceEarnFields).forEach((k) => {
      delete state.reputationPhalaBinanceEarnFields[k];
    });
  }

  function setReputationPhalaBinanceEarnFields(fields) {
    resetReputationPhalaBinanceEarnFields();
    Object.assign(state.reputationPhalaBinanceEarnFields, fields || {});
    return state.reputationPhalaBinanceEarnFields;
  }

  function getReputationPhalaBinanceEarnFields() {
    return state.reputationPhalaBinanceEarnFields;
  }

  function clearInjectDebounceTimer() {
    if (state.injectDebounceTimer) {
      clearTimeout(state.injectDebounceTimer);
      state.injectDebounceTimer = null;
    }
  }

  function removeTabLifecycleListeners() {
    clearInjectDebounceTimer();
    if (typeof chrome !== 'undefined' && chrome?.tabs?.onUpdated && state.tabUpdatedListener) {
      chrome.tabs.onUpdated.removeListener(state.tabUpdatedListener);
      state.tabUpdatedListener = null;
    }
    if (typeof chrome !== 'undefined' && chrome?.tabs?.onRemoved && state.tabRemovedListener) {
      chrome.tabs.onRemoved.removeListener(state.tabRemovedListener);
      state.tabRemovedListener = null;
    }
  }

  function reset() {
    removeTabLifecycleListeners();
    state.dataSourcePageTabId = null;
    state.activeTemplate = {};
    state.currExtentionId = null;
    state.isReadyRequest = false;
    state.phase = PAGE_DECODE_PHASES.IDLE;
    state.readyNotified = false;
    state.startHandled = false;
    state.operationType = null;
    state.formatAlgorithmParams = null;
    state.requestsMap = {};
    state.reportRequestIds = [];
    state.skipCancelOnNextDataSourceTabRemoved = false;
    state.resolvedAmazonStorefrontBaseUrl = null;
    state.uiResultSnapshot = null;
    state.jumpConfigState = null;
    state.PRE_ATTEST_PROMOT_V2 = [...DEFAULT_PRE_ATTEST_PROMPT_V2];
    state.ATTESTATION_PROCESS_NOTE_V2 = null;
    resetMonadFields();
    resetReputationPhalaBinanceEarnFields();
    Object.keys(state.channelSubscriptionFields).forEach((k) => {
      delete state.channelSubscriptionFields[k];
    });
    resetReputationPhalaFields();
    resetLumaPagedApprovedHits();
  }

  function removeFromRequestsMap(requestId) {
    delete state.requestsMap[requestId];
  }

  function storeInRequestsMap(requestId, urlInfo) {
    const last = state.requestsMap[requestId] || {};
    const urlInfoHeaders = urlInfo?.headers;
    if (
      urlInfoHeaders &&
      (urlInfoHeaders?.['Content-Type']?.includes('text/plain') ||
        urlInfoHeaders?.['content-type']?.includes('text/plain')) &&
      last.body
    ) {
      urlInfo.body = JSON.stringify(last.body);
    }
    state.requestsMap[requestId] = { ...last, ...urlInfo };
    return state.requestsMap[requestId];
  }

  return {
    get state() {
      return state;
    },
    getMonadFields,
    getReputationPhalaBinanceEarnFields,
    getReputationPhalaFields,
    getLumaPagedApprovedHits,
    reset,
    resetMonadFields,
    resetReputationPhalaBinanceEarnFields,
    resetReputationPhalaFields,
    resetLumaPagedApprovedHits,
    removeFromRequestsMap,
    setMonadFields,
    setReputationPhalaBinanceEarnFields,
    setReputationPhalaFields,
    setLumaPagedApprovedHits,
    storeInRequestsMap,
  };
}

/** Single shared instance for the background page decode flow */
let sharedStateInstance = null;

export function getPageDecodeState() {
  if (!sharedStateInstance) {
    sharedStateInstance = createPageDecodeState();
  }
  return sharedStateInstance;
}

export function resetPageDecodeState() {
  if (sharedStateInstance) {
    sharedStateInstance.reset();
  }
}
