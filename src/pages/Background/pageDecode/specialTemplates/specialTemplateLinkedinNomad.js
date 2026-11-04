/**
 * LinkedIn Nomad / location template (a87deb8c): capture and XPath validation helpers.
 */
/* global console, setTimeout, Promise */
import { matchesTemplateId } from './templateIdUtils.js';
import { checkIsRequiredUrl } from '../../utils/utils';
import { validateXPathWithLibs } from '../utils.js';
import { notifyPageDecodeReadyUi } from '../pageDecodeReadyUiNotify.js';

export const TEMPLATE_ID = 'a87deb8c-32c7-41c7-ac69-60bad0e35a38';
export const displayName = 'LinkedIn Nomad (location)';

/** Console filter tag when debugging stuck "Confirming login and account details...". */
export const LINKEDIN_NOMAD_LOG_TAG = 'LinkedInNomad';

/**
 * @param {string} event
 * @param {Record<string, unknown>} [detail]
 */
export function logLinkedInNomad(_event, _detail = {}) {
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
 * Push isReady to the data-source tab after profile reload / re-inject (content may miss webRequestIsReady).
 *
 * @param {{ activeTemplate?: object; isReadyRequest?: boolean; phase?: string; linkedinNomadUiNotified?: boolean }} state
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
export async function notifyLinkedInNomadReadyUi(state, options = {}) {
  if (!matches(state?.activeTemplate) || !state?.isReadyRequest) {
    return false;
  }
  const ok = await notifyPageDecodeReadyUi(state, options);
  if (ok) {
    state.linkedinNomadUiNotified = true;
    logLinkedInNomad('uiSyncNotify', { sent: true });
  } else {
    logLinkedInNomad('uiSyncNotify', { sent: false });
  }
  return ok;
}

/**
 * Run template XPath strings against HTML (same libs as checkSDKTargetRequest).
 *
 * @param {string} html
 * @param {unknown[]} jsonPathArr
 * @returns {Array<{ xpath: string; matchCount: number; values: string[] }>}
 */
export function previewXPathValidationOnHtml(html, jsonPathArr) {
  if (typeof html !== 'string' || !html) {
    return [];
  }
  return jsonPathArr
    .filter((item) => typeof item === 'string')
    .map((xpath) => {
      const values = validateXPathWithLibs(html, xpath);
      return {
        xpath,
        matchCount: values.length,
        values: values
          .slice(0, 3)
          .map((v) =>
            typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 120) : String(v)
          ),
      };
    });
}

export function summarizeLinkedInNomadCapture(requests, requestsMap) {
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
        ignoreResponse: r.ignoreResponse,
        validated,
        captures,
      };
    });
}
