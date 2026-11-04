/* global console, setTimeout */
/** Placeholder navigation so the tab id exists before the real page requests fire. */
export const DATA_SOURCE_TAB_PLACEHOLDER_URL = 'about:blank';

const NAVIGATION_POLL_MS = 50;

/**
 * Committed tab URL that chrome.scripting can access under host_permissions.
 * about:blank is not covered and executeScript throws, which aborts attestation.
 * @param {string | null | undefined} url
 * @returns {boolean}
 */
export function isInjectableHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

/**
 * @param {number} tabId
 * @param {{ get: (tabId: number) => Promise<{ url?: string }> }} tabsApi
 * @param {number} timeoutMs
 * @returns {Promise<boolean>}
 */
export async function waitForCommittedHttpUrl(tabId, tabsApi, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const tab = await tabsApi.get(tabId);
    if (isInjectableHttpUrl(tab?.url)) {
      return true;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, NAVIGATION_POLL_MS);
    });
  }
  return false;
}

/**
 * Create a blank tab, publish its id, then navigate to jumpTo.
 * webRequest listeners that filter on the published id then see the first
 * requests from the destination page (Hyperliquid legalCheck).
 * When tabsApi.get exists, wait until the committed URL is http(s) so later
 * scripting does not run against about:blank.
 * @param {string} jumpTo
 * @param {(tabId: number) => void} assignTabId
 * @param {{ create: (props: { url: string }) => Promise<{ id?: number }>; update: (tabId: number, props: { url: string }) => Promise<unknown>; get?: (tabId: number) => Promise<{ url?: string }> }} tabsApi
 * @param {{ navigationTimeoutMs?: number }} [options]
 * @returns {Promise<number>}
 */
export async function openDataSourceTabAssignIdThenNavigate(
  jumpTo,
  assignTabId,
  tabsApi,
  options = {}
) {
  const tab = await tabsApi.create({ url: DATA_SOURCE_TAB_PLACEHOLDER_URL });
  const tabId = tab?.id;
  if (tabId == null) {
    throw new Error('openDataSourceTabAssignIdThenNavigate: missing tab id');
  }
  assignTabId(tabId);
  if (typeof jumpTo === 'string' && jumpTo) {
    await tabsApi.update(tabId, { url: jumpTo });
    if (typeof tabsApi.get === 'function') {
      const ready = await waitForCommittedHttpUrl(
        tabId,
        tabsApi,
        options.navigationTimeoutMs ?? 15000
      );
      if (!ready) {
        console.warn(
          'pageDecode: data source tab did not reach an http(s) url before inject',
          tabId,
          jumpTo
        );
      }
    }
  }
  return tabId;
}
