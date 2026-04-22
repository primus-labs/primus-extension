import { rewriteUrlOrigin } from './urlOriginRewrite';

/**
 * Use the first captured request as the source of truth
 * for algorithm host and request URL origin.
 * @param {object[]} formatRequests
 * @returns {string|null}
 */
export function getTrueRequestOrigin(formatRequests) {
  if (!Array.isArray(formatRequests)) return null;
  for (const fr of formatRequests) {
    if (fr?.needCapture === false) continue;
    const rawUrl = fr?.url;
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
    try {
      return new URL(rawUrl).origin;
    } catch (_e) {
      // ignore invalid URL and continue
    }
  }
  return null;
}

/**
 * @param {object[]} formatRequests
 * @returns {string|null}
 */
export function getTrueRequestHostname(formatRequests) {
  const origin = getTrueRequestOrigin(formatRequests);
  if (!origin) return null;
  try {
    return new URL(origin).hostname;
  } catch (_e) {
    return null;
  }
}

/**
 * Rewrite every algorithm request URL to the origin of the
 * first captured request, keeping path/query/hash unchanged.
 * @param {object[]} formatRequests
 * @returns {string|null} Hostname without port, or null if unavailable.
 */
export function rewriteRequestUrlsToTrueOrigin(formatRequests) {
  const origin = getTrueRequestOrigin(formatRequests);
  if (!origin || !Array.isArray(formatRequests)) return null;

  for (const fr of formatRequests) {
    const rawUrl = fr?.url;
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
    fr.url = rewriteUrlOrigin(rawUrl, origin);
  }

  try {
    return new URL(origin).hostname;
  } catch (_e) {
    return null;
  }
}
