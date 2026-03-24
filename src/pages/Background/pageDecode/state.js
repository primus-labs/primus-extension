/**
 * Centralized state for the page decode / attestation flow.
 * Replaces module-level mutable variables for testability and clear lifecycle.
 */
const DEFAULT_PRE_ATTEST_PROMPT_V2 = [
  { text: ['Processing data'], showTime: 5000 },
  { text: ['Checking data', 'Ensure login and on target page.'], showTime: 30000 },
];

export function createPageDecodeState() {
  const state = {
    dataSourcePageTabId: null,
    activeTemplate: {},
    currExtentionId: null,
    isReadyRequest: false,
    operationType: null,
    formatAlgorithmParams: null,
    onBeforeSendHeadersFn: () => {},
    onBeforeRequestFn: () => {},
    requestsMap: {},
    reportRequestIds: [],
    /** For template 9119207f: response of 2nd request sent by extension with 1st request headers/cookie */
    specialSecondRequestResponse: null,
    specialSecondRequestSent: false,
    /** For template 99d6d02a (LinkedIn Connections): pagination cache and in-flight promise */
    linkedinVoyagerPaginationCache: null,
    linkedinVoyagerPaginationInFlight: null,
    PRE_ATTEST_PROMOT_V2: [...DEFAULT_PRE_ATTEST_PROMPT_V2],
    /**
     * If true, the next data-source tab removal (e.g. chrome.tabs.remove) is treated as programmatic:
     * onRemoved skips handlerForSdk('cancel') so the DApp is not sent cancel/failure after a successful attestation.
     * Set by closeSdkDataSourceTabWithoutCancel before closing; cleared by the onRemoved listener after handling.
     */
    skipCancelOnNextDataSourceTabRemoved: false,
    /** Set for Amazon account-manage template: storefront base URL for jumpTo + no-capture request URLs */
    resolvedAmazonStorefrontBaseUrl: null,
    /** Runtime for dataPageTemplate.jumpConfig multi-step redirects; see jumpConfigRedirect.js */
    jumpConfigState: null,
  };

  function reset() {
    state.isReadyRequest = false;
    state.operationType = null;
    state.formatAlgorithmParams = null;
    state.requestsMap = {};
    state.reportRequestIds = [];
    state.specialSecondRequestResponse = null;
    state.specialSecondRequestSent = false;
    state.linkedinVoyagerPaginationCache = null;
    state.linkedinVoyagerPaginationInFlight = null;
    state.resolvedAmazonStorefrontBaseUrl = null;
    state.jumpConfigState = null;
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
    reset,
    removeFromRequestsMap,
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
