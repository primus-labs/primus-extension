import {
  JSON_PATH_EVALUATION_KEY,
  VALIDATION_JSON_PATH_KEY,
  resolveJsonPathForValidation,
} from '../../padoZKAttestationJSSDK/buildAggregateSubcondition.js';
import { getResponseDataForTemplateRequestUrl } from '../specialTemplates/emptyArrayJsonPathTruncate/patchFormatResponse.js';
import { truncateJsonPathAtUnreachable } from '../specialTemplates/cursorDashboard/truncateJsonPathAtUnreachable.js';

/**
 * @param {string} pathExpr
 * @returns {boolean}
 */
function isResponseJsonPathString(pathExpr) {
  return (
    typeof pathExpr === 'string' &&
    pathExpr.startsWith('$') &&
    !pathExpr.startsWith('^.')
  );
}

/**
 * @param {Record<string, unknown>} sub
 * @param {string} truncatedPath
 */
function applyTruncatedFieldPath(sub, truncatedPath) {
  if (typeof sub[VALIDATION_JSON_PATH_KEY] === 'string') {
    sub[VALIDATION_JSON_PATH_KEY] = truncatedPath;
  }

  const field = sub.field;
  if (field && typeof field === 'object' && !Array.isArray(field)) {
    if (field.type === 'FIELD_ARITHMETIC' && typeof field.field === 'string') {
      field.field = truncatedPath;
    }
    return;
  }
  if (typeof field === 'string' && isResponseJsonPathString(field)) {
    sub.field = truncatedPath;
  }
}

/**
 * @param {Record<string, unknown>} sub
 * @param {unknown} responseRoot
 */
function patchSubconditionForTemplateFieldTruncate(sub, responseRoot) {
  if (!sub || typeof sub !== 'object') {
    return;
  }
  if (sub[JSON_PATH_EVALUATION_KEY]?.truncateUnreachable !== true) {
    return;
  }

  const resolved = resolveJsonPathForValidation(sub);
  const pathCandidates = [];
  if (typeof resolved === 'string' && isResponseJsonPathString(resolved)) {
    pathCandidates.push(resolved);
  }
  const anchor = sub[VALIDATION_JSON_PATH_KEY];
  if (typeof anchor === 'string' && isResponseJsonPathString(anchor)) {
    pathCandidates.push(anchor.trim());
  }
  if (typeof sub.field === 'string' && isResponseJsonPathString(sub.field)) {
    pathCandidates.push(sub.field);
  }

  const uniquePaths = [...new Set(pathCandidates)];
  for (const pathExpr of uniquePaths) {
    const { path, truncated } = truncateJsonPathAtUnreachable(
      pathExpr,
      responseRoot
    );
    if (!truncated) {
      continue;
    }
    applyTruncatedFieldPath(sub, path);
    break;
  }
}

/**
 * @param {unknown} resp
 * @param {unknown} responseRoot
 */
function patchOneFormatResponseEntry(resp, responseRoot) {
  if (responseRoot == null || resp == null) {
    return;
  }
  const subs = resp?.conditions?.subconditions;
  if (!Array.isArray(subs)) {
    return;
  }
  for (const sub of subs) {
    patchSubconditionForTemplateFieldTruncate(sub, responseRoot);
  }
}

/**
 * Patch algorithm response subconditions that opt in via feilds[].jsonPathEvaluation.
 *
 * @param {unknown[]} formatResponse
 * @param {Record<string, unknown>} requestsMap
 * @param {Array<{ url?: string }> | undefined} templateRequests
 */
export function patchFormatResponseJsonPathsForTemplateFieldTruncate(
  formatResponse,
  requestsMap,
  templateRequests
) {
  if (!Array.isArray(formatResponse)) {
    return;
  }
  for (let i = 0; i < formatResponse.length; i += 1) {
    const templateUrl = Array.isArray(templateRequests)
      ? templateRequests[i]?.url
      : undefined;
    const responseRoot = getResponseDataForTemplateRequestUrl(
      requestsMap,
      templateUrl
    );
    if (responseRoot == null) {
      continue;
    }
    patchOneFormatResponseEntry(formatResponse[i], responseRoot);
  }
}
