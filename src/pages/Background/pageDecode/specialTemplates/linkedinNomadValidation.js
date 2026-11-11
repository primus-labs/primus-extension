/**
 * Pure helpers for LinkedIn Nomad (a87deb8c): profile URL equivalence and HTML fragment routing.
 * No chrome / page-decode state dependencies (unit-testable).
 */

export const LINKEDIN_NOMAD_ME_URL_PREFIX =
  'https://www.linkedin.com/voyager/api/me';

const LINKEDIN_HOST = 'www.linkedin.com';
const PROFILE_PATH_RE = /^\/in\/[^/]+\/?$/i;
const BLOCKED_PATH_RE = /\/(login|checkpoint|uas\/)/i;

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isLinkedInNomadProfileCaptureUrl(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return false;
  }
  try {
    const parsed = new URL(url.trim());
      if (parsed.hostname !== LINKEDIN_HOST) {
      return false;
    }
    if (BLOCKED_PATH_RE.test(parsed.pathname)) {
      return false;
    }
    return /^\/in\/[^/]+/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * @param {string} url
 * @returns {{ pathname: string } | null}
 */
function normalizeLinkedInProfileUrlForEquivalence(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return null;
  }
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname !== LINKEDIN_HOST) {
      return null;
    }
    if (BLOCKED_PATH_RE.test(parsed.pathname)) {
      return null;
    }
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    if (!/^\/in\/[^/]+$/i.test(pathname)) {
      return null;
    }
    return { pathname: pathname.toLowerCase() };
  } catch {
    return null;
  }
}

/**
 * Safe equivalence: same `/in/{handle}` pathname; query differences (e.g. isSelfProfile) allowed.
 *
 * @param {string} requestUrl
 * @param {string} responseUrl
 * @returns {boolean}
 */
export function isLinkedInProfileUrlEquivalent(requestUrl, responseUrl) {
  if (typeof responseUrl !== 'string' || !responseUrl) {
    return true;
  }
  const req = normalizeLinkedInProfileUrlForEquivalence(requestUrl);
  const res = normalizeLinkedInProfileUrlForEquivalence(responseUrl);
  if (!req || !res) {
    return false;
  }
  return req.pathname === res.pathname;
}

/**
 * LinkedIn profile HTML fragment without a full `<html>` document (Nomad location slot only).
 *
 * @param {string} [contentType]
 * @param {unknown} data
 * @returns {boolean}
 */
export function shouldTreatLinkedInProfileHtmlFragment(contentType, data) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('application/json') || ct.includes('+json')) {
    return false;
  }
  if (typeof data !== 'string' || !data.trim()) {
    return false;
  }
  if (!/^\s*</.test(data)) {
    return false;
  }
  if (/^\s*\{/.test(data.trim())) {
    return false;
  }
  if (/<\s*html[\s>]/i.test(data)) {
    return false;
  }
  return /<\s*(section|main|div|p)[\s>]/i.test(data);
}
