import * as cursorDashboard from './specialTemplateCursorDashboard.js';
import {
  getJsonPathEvaluationOptionsForTemplate as getPnlJsonPathOptions,
  tryPatchFormatResponseForEmptyArrayJsonPathTruncate,
} from './pageDecodePnlHooks.js';
import { patchCursorDashboardFormatResponse } from './cursorDashboard/patchCursorDashboardFormatResponse.js';

/** @typedef {{ truncateAtEmptyArray?: boolean; truncateUnreachable?: boolean }} JsonPathEvaluationOptions */

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {JsonPathEvaluationOptions | undefined}
 */
export function getJsonPathEvaluationOptionsForTemplate(activeTemplate) {
  /** @type {JsonPathEvaluationOptions} */
  const options = {};
  const pnlOptions = getPnlJsonPathOptions(activeTemplate);
  if (pnlOptions?.truncateAtEmptyArray) {
    options.truncateAtEmptyArray = true;
  }
  if (cursorDashboard.matches(activeTemplate)) {
    options.truncateUnreachable = true;
  }
  if (Object.keys(options).length === 0) {
    return undefined;
  }
  return options;
}

/**
 * @param {unknown[]} formatResponse
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @param {Record<string, unknown>} requestsMap
 */
export function tryPatchFormatResponseJsonPathsForTemplate(
  formatResponse,
  activeTemplate,
  requestsMap
) {
  tryPatchFormatResponseForEmptyArrayJsonPathTruncate(
    formatResponse,
    activeTemplate,
    requestsMap
  );
  if (!cursorDashboard.matches(activeTemplate)) {
    return;
  }
  const templateRequests = activeTemplate?.datasourceTemplate?.requests;
  patchCursorDashboardFormatResponse(
    formatResponse,
    requestsMap,
    templateRequests
  );
}

export { TEMPLATE_ID as TEMPLATE_ID_CURSOR_DASHBOARD } from './specialTemplateCursorDashboard.js';
