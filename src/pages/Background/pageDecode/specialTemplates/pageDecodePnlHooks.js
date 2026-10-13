import * as polymarket from './specialTemplatePnlPolymarket.js';
import * as fomo from './specialTemplatePnlFomo.js';
import * as hyperliquid from './specialTemplatePnlHyperliquid.js';
import { patchFormatResponseJsonPathsForEmptyArrayTruncate } from './emptyArrayJsonPathTruncate/patchFormatResponse.js';

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
 * @typedef {{
 *   gap?: number;
 *   selectors?: string[];
 *   matchText?: string[];
 * }} PageDecodeHostModalAnchor
 */

/** @typedef {'center' | 'bottomRight' | 'centerRight'} PageDecodeModalPlacement */

const VALID_MODAL_PLACEMENTS = new Set([
  'center',
  'bottomRight',
  'centerRight',
]);

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeRequest
 * @returns {PageDecodeModalPlacement}
 */
export function getPageDecodeModalPlacement(activeRequest) {
  const modal = resolvePnlTemplate(activeRequest)?.hooks?.pageDecodeModal;
  const placement = modal?.placement;
  if (typeof placement === 'string' && VALID_MODAL_PLACEMENTS.has(placement)) {
    return /** @type {PageDecodeModalPlacement} */ (placement);
  }
  if (modal?.bottomRight === true) {
    return 'bottomRight';
  }
  return 'center';
}

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
  return getPageDecodeModalPlacement(activeRequest) === 'bottomRight';
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeRequest
 * @returns {PageDecodeHostModalAnchor | null}
 */
export function getPageDecodeHostModalAnchor(activeRequest) {
  const anchor = resolvePnlTemplate(activeRequest)?.hooks?.pageDecodeModal?.hostModalAnchor;
  if (!anchor || typeof anchor !== 'object') return null;
  return /** @type {PageDecodeHostModalAnchor} */ (anchor);
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
  const templateRequests = activeTemplate?.datasourceTemplate?.requests;
  patchFormatResponseJsonPathsForEmptyArrayTruncate(
    formatResponse,
    requestsMap,
    templateRequests
  );
}
