/**
 * GitHub home / user-login meta template (38396d71): debug logging for URL match, replay, XPath.
 * Filter DevTools console with: GitHubHome
 */
/* global console */
import { matchesTemplateId } from './templateIdUtils.js';
import { checkIsRequiredUrl } from '../../utils/utils.js';

export const TEMPLATE_ID = '38396d71-242d-49da-a1aa-0affc3f70eaf';
export const displayName = 'GitHub home (user-login meta)';

/** Console filter tag when debugging stuck "Confirming login...". */
export const GITHUB_HOME_LOG_TAG = 'GitHubHome';

/**
 * @param {string} event
 * @param {Record<string, unknown>} [detail]
 */
export function logGitHubHome(event, detail = {}) {
  console.log(GITHUB_HOME_LOG_TAG, event, {
    templateId: TEMPLATE_ID,
    at: Date.now(),
    ...detail,
  });
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
export function summarizeGithubHomeCapture(requests, requestsMap) {
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
      return {
        slot,
        templateUrl: r.url,
        urlType: r.urlType || 'REGX',
        ignoreResponse: r.ignoreResponse,
        validated,
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
    .map((r, slot) => ({
      slot,
      requiredUrl: r.url,
      urlType: r.urlType || 'REGX',
      method: r.method,
      matched: checkIsRequiredUrl({
        requestUrl,
        requiredUrl: r.url,
        urlType: r.urlType || 'REGX',
        queryParams: r.queryParams,
      }),
    }));
}
