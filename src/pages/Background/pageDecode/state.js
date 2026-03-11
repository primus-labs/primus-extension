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
    githubUserMenuRedirectDone: false,
    PRE_ATTEST_PROMOT_V2: [...DEFAULT_PRE_ATTEST_PROMPT_V2],
  };

  function reset() {
    state.isReadyRequest = false;
    state.operationType = null;
    state.formatAlgorithmParams = null;
    state.requestsMap = {};
    state.reportRequestIds = [];
    state.githubUserMenuRedirectDone = false;
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
