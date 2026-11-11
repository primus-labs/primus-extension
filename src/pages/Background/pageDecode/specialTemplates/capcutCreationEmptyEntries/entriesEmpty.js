import jp from 'jsonpath';
import { matchesTemplateId } from '../templateIdUtils.js';
import {
  ENTRIES_QUERY_URL_MARKER,
  TEMPLATE_ID_CAPCUT_CREATION,
} from './constants.js';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 */
export function isCapcutCreationTemplate(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID_CAPCUT_CREATION);
}

/**
 * @param {string | undefined | null} urlOrTemplateExpr
 */
export function isCapcutEntriesQueryUrl(urlOrTemplateExpr) {
  if (typeof urlOrTemplateExpr !== 'string' || !urlOrTemplateExpr) {
    return false;
  }
  return urlOrTemplateExpr.includes(ENTRIES_QUERY_URL_MARKER);
}

/**
 * True when $.data.entries is missing, null, or an empty array.
 *
 * @param {unknown} responseData
 */
export function isEntriesEmpty(responseData) {
  if (responseData == null || typeof responseData !== 'object') {
    return false;
  }
  try {
    const nodes = jp.query(responseData, '$.data.entries');
    if (!nodes.length) {
      return true;
    }
    const entries = nodes[0];
    if (entries == null) {
      return true;
    }
    return Array.isArray(entries) && entries.length === 0;
  } catch {
    return false;
  }
}
