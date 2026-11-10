import jp from 'jsonpath';
import { matchesTemplateId } from '../templateIdUtils.js';
import {
  HAILUO_CREATION_MY_URL_MARKER,
  TEMPLATE_ID_HAILUO_CREATION,
} from './constants.js';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 */
export function isHailuoCreationTemplate(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID_HAILUO_CREATION);
}

/**
 * @param {string | undefined | null} urlOrTemplateExpr
 */
export function isHailuoCreationRequestUrl(urlOrTemplateExpr) {
  if (typeof urlOrTemplateExpr !== 'string' || !urlOrTemplateExpr) {
    return false;
  }
  return urlOrTemplateExpr.includes(HAILUO_CREATION_MY_URL_MARKER);
}

/**
 * True when $.data.feeds is missing, null, or an empty array.
 *
 * @param {unknown} responseData
 */
export function isCreationFeedsEmpty(responseData) {
  if (responseData == null || typeof responseData !== 'object') {
    return false;
  }
  try {
    const nodes = jp.query(responseData, '$.data.feeds');
    if (!nodes.length) {
      return true;
    }
    const feeds = nodes[0];
    if (feeds == null) {
      return true;
    }
    return Array.isArray(feeds) && feeds.length === 0;
  } catch {
    return false;
  }
}
