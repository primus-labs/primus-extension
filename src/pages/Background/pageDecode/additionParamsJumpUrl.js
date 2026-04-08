/**
 * additionParams.jumpToUrl: replace origin on jumpTo and no-capture algorithm request URLs.
 * Runs after template baseUrl / launch_page (attestation) and after Amazon geo rewrite (page decode init).
 * launch_page replaces the full jumpTo URL; jumpToUrl only swaps the origin and keeps path, query, hash.
 */

import { getPageDecodeState } from './state';
import { rewriteUrlOrigin } from './urlOriginRewrite';

/**
 * @param {string} raw
 * @returns {string|null}
 */
function trimValidJumpUrlBase(raw) {
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
 * Sets state.jumpUrlRewriteSourceHostname when a rewrite is applied (for algorithm no-capture URL matching).
 * @param {object} activeTemplate
 */
export function applyAdditionParamsJumpUrlToJumpTo(activeTemplate) {
  const { state } = getPageDecodeState();
  state.jumpUrlRewriteSourceHostname = null;

  const base = trimValidJumpUrlBase(
    activeTemplate?.additionParamsObj?.jumpToUrl ?? ''
  );
  if (!base) return;

  const jumpTo = activeTemplate?.jumpTo;
  if (typeof jumpTo !== 'string' || !jumpTo.trim()) return;

  let sourceHostname;
  try {
    sourceHostname = new URL(jumpTo).hostname;
  } catch (_e) {
    return;
  }

  state.jumpUrlRewriteSourceHostname = sourceHostname;
  activeTemplate.jumpTo = rewriteUrlOrigin(jumpTo, base);
}

/**
 * @param {object} activeTemplate
 * @returns {string|null} Hostname without port, or null if N/A.
 */
export function getJumpUrlHostOverrideForAlgorithmParams(activeTemplate) {
  const base = trimValidJumpUrlBase(
    activeTemplate?.additionParamsObj?.jumpToUrl ?? ''
  );
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch (_e) {
    return null;
  }
}

/**
 * Rewrite `needCapture: false` request URLs whose host matched jumpTo before jumpToUrl rewrite.
 * @param {object[]} formatRequests Built request list (mutated in place).
 * @param {object} activeTemplate
 */
export function rewriteNoCaptureRequestUrlsForJumpUrl(
  formatRequests,
  activeTemplate
) {
  const base = trimValidJumpUrlBase(
    activeTemplate?.additionParamsObj?.jumpToUrl ?? ''
  );
  if (!base) return;

  const sourceHostname = getPageDecodeState().state.jumpUrlRewriteSourceHostname;
  if (typeof sourceHostname !== 'string' || !sourceHostname) return;

  for (const fr of formatRequests) {
    if (fr.needCapture !== false) continue;
    const rawUrl = fr.url;
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
    try {
      if (new URL(rawUrl).hostname !== sourceHostname) continue;
    } catch (_e) {
      continue;
    }
    fr.url = rewriteUrlOrigin(rawUrl, base);
  }
}
