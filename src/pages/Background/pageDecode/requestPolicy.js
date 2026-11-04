/**
 * Keep background replays out of capture while allowing the extension-driven
 * navigation of the actual data-source tab.
 * @param {{ initiator?: string; tabId?: number; type?: string } | null | undefined} details
 * @param {{ dataSourcePageTabId?: number | null } | null | undefined} state
 * @param {string} runtimeId
 * @returns {boolean}
 */
export function shouldIgnorePageDecodeWebRequest(details, state, runtimeId) {
  const dataSourcePageTabId = state?.dataSourcePageTabId;
  const isDataSourceTab = details?.tabId === dataSourcePageTabId;
  const isExtensionInitiated =
    typeof details?.initiator === 'string' &&
    details.initiator.startsWith(`chrome-extension://${runtimeId}`);

  if (isExtensionInitiated) {
    return !(isDataSourceTab && details?.type === 'main_frame');
  }

  return ![-1, dataSourcePageTabId].includes(details?.tabId);
}

/**
 * Capture and replay may finish before the content script is listening.
 * @param {{ contentReady?: boolean } | null | undefined} state
 * @returns {boolean}
 */
export function canFinalizePageDecodeReady(state) {
  return state?.contentReady === true;
}
