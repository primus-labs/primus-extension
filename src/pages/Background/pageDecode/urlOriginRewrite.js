/**
 * Replace a URL's origin with a base URL; keep path, query, and hash.
 * @param {string} url
 * @param {string} baseUrl
 * @returns {string}
 */
export function rewriteUrlOrigin(url, baseUrl) {
  try {
    const parsed = new URL(url);
    const base = baseUrl.replace(/\/+$/, '');
    return new URL(parsed.pathname + parsed.search + parsed.hash, base).href;
  } catch (_e) {
    return url;
  }
}
