/**
 * additionParams.jumpToUrl: replace origin on jumpTo and no-capture algorithm request URLs.
 * Runs after template baseUrl / launch_page (attestation) and after Amazon geo rewrite (page decode init).
 * launch_page replaces the full jumpTo URL; jumpToUrl only swaps the origin and keeps path, query, hash.
 */

import { rewriteUrlOrigin } from './urlOriginRewrite';
import {
  getTrueRequestHostname,
  rewriteRequestUrlsToTrueOrigin,
} from './requestHostOverride';

/**
 * @param {string} raw
 * @returns {string|null}
 */
export function trimValidJumpUrlBase(raw) {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    const parsed = new URL(t);
    return parsed.href.replace(/\/+$/, '');
  } catch (_e) {
    return null;
  }
}

/**
 * After Amazon (or plain template) jumpTo is final, optionally rewrite origin from additionParams.jumpToUrl.
 * @param {object} activeTemplate
 */
export function applyAdditionParamsJumpUrlToJumpTo(activeTemplate) {
  const base = trimValidJumpUrlBase(
    activeTemplate?.additionParamsObj?.jumpToUrl ?? ''
  );
  if (!base) return;

  const jumpTo = activeTemplate?.jumpTo;
  if (typeof jumpTo !== 'string' || !jumpTo.trim()) return;
  activeTemplate.jumpTo = rewriteUrlOrigin(jumpTo, base);
}

/**
 * @param {object} activeTemplate
 * @param {object[]} formatRequests
 * @returns {string|null} Hostname without port, or null if N/A.
 */
export function getJumpUrlHostOverrideForAlgorithmParams(
  activeTemplate,
  formatRequests
) {
  const base = trimValidJumpUrlBase(
    activeTemplate?.additionParamsObj?.jumpToUrl ?? ''
  );
  if (!base) return null;
  return getTrueRequestHostname(formatRequests);
}

/**
 * When jumpToUrl is used, align every algorithm request URL
 * with the hostname of the real captured request.
 * @param {object[]} formatRequests Built request list (mutated in place).
 * @param {object} activeTemplate
 * @returns {string|null} Hostname without port, or null if N/A.
 */
export function rewriteRequestUrlsForJumpUrl(
  formatRequests,
  activeTemplate
) {
  const base = trimValidJumpUrlBase(
    activeTemplate?.additionParamsObj?.jumpToUrl ?? ''
  );
  if (!base) return null;
  return rewriteRequestUrlsToTrueOrigin(formatRequests);
}
