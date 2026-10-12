import * as polymarket from './specialTemplatePnlPolymarket.js';
import * as fomo from './specialTemplatePnlFomo.js';
import * as hyperliquid from './specialTemplatePnlHyperliquid.js';
import {
  getTargetResponseDataFromRequestsMap,
  patchFormatResponseJsonPathsForEmptyArrayTruncate,
} from './emptyArrayJsonPathTruncate/patchFormatResponse.js';

/**
 * @typedef {typeof polymarket | typeof fomo | typeof hyperliquid} PnlTemplateModule
 */

/** @type {PnlTemplateModule[]} */
export const PNL_TEMPLATE_MODULES = [polymarket, fomo, hyperliquid];

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {PnlTemplateModule | null}
 */
export function resolvePnlTemplate(activeTemplate) {
  return PNL_TEMPLATE_MODULES.find((mod) => mod.matches(activeTemplate)) ?? null;
}

export { TEMPLATE_ID as TEMPLATE_ID_POLYMARKET } from './specialTemplatePnlPolymarket.js';
export { TEMPLATE_ID as TEMPLATE_ID_FOMO } from './specialTemplatePnlFomo.js';
export { TEMPLATE_ID as TEMPLATE_ID_HYPERLIQUID } from './specialTemplatePnlHyperliquid.js';

/** @typedef {{ truncateAtEmptyArray?: boolean }} JsonPathEvaluationOptions */

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeRequest
 * @returns {boolean}
 */
export function shouldUseDarkModalForTemplate(activeRequest) {
  const mod = resolvePnlTemplate(activeRequest);
  return mod?.hooks?.pageDecodeModal?.darkTheme === true;
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeRequest
 * @returns {boolean}
 */
export function shouldUseBottomRightModalForTemplate(activeRequest) {
  const mod = resolvePnlTemplate(activeRequest);
  return mod?.hooks?.pageDecodeModal?.bottomRight === true;
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {JsonPathEvaluationOptions | undefined}
 */
export function getJsonPathEvaluationOptionsForTemplate(activeTemplate) {
  const mod = resolvePnlTemplate(activeTemplate);
  if (mod?.hooks?.jsonPath?.truncateAtEmptyArray !== true) {
    return undefined;
  }
  return { truncateAtEmptyArray: true };
}

/**
 * @param {unknown[]} formatResponse
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @param {Record<string, unknown>} requestsMap
 */
export function tryPatchFormatResponseForEmptyArrayJsonPathTruncate(
  formatResponse,
  activeTemplate,
  requestsMap
) {
  const mod = resolvePnlTemplate(activeTemplate);
  if (mod?.hooks?.jsonPath?.truncateAtEmptyArray !== true) {
    return;
  }
  const responseRoot = getTargetResponseDataFromRequestsMap(requestsMap);
  patchFormatResponseJsonPathsForEmptyArrayTruncate(formatResponse, responseRoot);
}
