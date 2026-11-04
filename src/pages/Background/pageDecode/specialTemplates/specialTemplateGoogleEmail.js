/**
 * Google Account email (0385fbd1): URL match helpers and capture summaries.
 */
/* global console */
import { matchesTemplateId } from './templateIdUtils.js';
import { checkIsRequiredUrl, matchReg } from '../../utils/utils.js';

export const TEMPLATE_ID = '0385fbd1-a652-48ea-924a-52e4d81f7c9c';
export const displayName = 'Google Account email';

export const GOOGLE_EMAIL_LOG_TAG = 'GoogleEmail';

/**
 * @param {string} event
 * @param {Record<string, unknown>} [detail]
 */
export function logGoogleEmail(_event, _detail = {}) {
  /* debug logging disabled */
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

/**
 * @param {Array<{ url?: string; urlType?: string; queryParams?: unknown; needCapture?: boolean }>} requests
 * @param {Record<string, { url?: string; templateRequestUrl?: string; isTarget?: number; type?: string }>} requestsMap
 */
export function summarizeGoogleEmailCapture(requests, requestsMap) {
  if (!Array.isArray(requests) || !requestsMap) {
    return [];
  }
  return requests
    .filter((r) => r.needCapture !== false)
    .map((r, slot) => {
      const captures = Object.entries(requestsMap)
        .filter(([, info]) =>
          checkIsRequiredUrl({
            requestUrl: info?.url || '',
            requiredUrl: r.url,
            urlType: r.urlType || 'REGX',
            queryParams: r.queryParams,
          })
        )
        .map(([requestId, info]) => ({
          requestId,
          url: info.url,
          templateRequestUrl: info.templateRequestUrl,
          isTarget: info.isTarget,
          type: info.type,
        }));
      const validated = captures.some((c) => c.isTarget === 1);
      const regxPatternBroken =
        (r.urlType || 'REGX') === 'REGX' &&
        typeof r.url === 'string' &&
        r.url.includes('?') &&
        !r.url.includes('\\?') &&
        typeof captures[0]?.url === 'string' &&
        !matchReg(r.url, captures[0].url);
      return {
        slot,
        templateUrl: r.url,
        urlType: r.urlType || 'REGX',
        ignoreResponse: r.ignoreResponse,
        validated,
        regxLikelyBrokenDueToUnescapedQuery: regxPatternBroken,
        captures,
      };
    });
}

/**
 * @param {string} requestUrl
 * @param {Array<{ url?: string; urlType?: string; queryParams?: unknown; needCapture?: boolean; method?: string }>} requests
 */
export function describeUrlMatchForRequests(requestUrl, requests) {
  if (!Array.isArray(requests)) {
    return [];
  }
  return requests
    .filter((r) => r.needCapture !== false)
    .map((r, slot) => {
      const urlType = r.urlType || 'REGX';
      const matched = checkIsRequiredUrl({
        requestUrl,
        requiredUrl: r.url,
        urlType,
        queryParams: r.queryParams,
      });
      const exactEqual =
        typeof requestUrl === 'string' &&
        typeof r.url === 'string' &&
        requestUrl === r.url;
      const regxDirect =
        urlType === 'REGX' &&
        typeof r.url === 'string' &&
        typeof requestUrl === 'string'
          ? !!matchReg(r.url, requestUrl)
          : null;
      return {
        slot,
        requiredUrl: r.url,
        urlType,
        method: r.method,
        matched,
        exactUrlEqual: exactEqual,
        regxDirectMatch: regxDirect,
      };
    });
}

/**
 * @param {string} requestUrl
 * @returns {boolean}
 */
export function shouldLogUrlProbeForRequest(requestUrl) {
  if (typeof requestUrl !== 'string' || !requestUrl) {
    return false;
  }
  try {
    return new URL(requestUrl).hostname === 'myaccount.google.com';
  } catch {
    return requestUrl.includes('myaccount.google.com');
  }
}
