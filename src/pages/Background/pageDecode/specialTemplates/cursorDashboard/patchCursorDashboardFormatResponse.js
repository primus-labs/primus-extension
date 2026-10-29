import {
  VALIDATION_JSON_PATH_KEY,
  resolveJsonPathForValidation,
} from '../../../padoZKAttestationJSSDK/buildAggregateSubcondition.js';
import { getResponseDataForTemplateRequestUrl } from '../emptyArrayJsonPathTruncate/patchFormatResponse.js';
import { truncateJsonPathAtUnreachable } from './truncateJsonPathAtUnreachable.js';

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
 * Drop FIELD_ARITHMETIC / aggregateOp; plain string reveal after path truncate.
 *
 * @param {Record<string, unknown>} sub
 * @param {string} truncatedPath
 */
function demoteAggregateFieldToPlainReveal(sub, truncatedPath) {
  sub.type = 'FIELD_REVEAL';
  sub.op = 'REVEAL_STRING';
  sub.field = truncatedPath;
}

/**
 * @param {Record<string, unknown>} sub
 * @param {unknown} responseRoot
 */
function patchSubconditionForCursorDashboard(sub, responseRoot) {
  if (!sub || typeof sub !== 'object') {
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
    if (!sub.field.includes('[*]')) {
      pathCandidates.push(sub.field);
    }
  }

  const uniquePaths = [...new Set(pathCandidates)];
  if (uniquePaths.length === 0) {
    return;
  }

  for (const pathExpr of uniquePaths) {
    const { path, truncated } = truncateJsonPathAtUnreachable(
      pathExpr,
      responseRoot
    );
    if (!truncated) {
      continue;
    }

    if (typeof sub[VALIDATION_JSON_PATH_KEY] === 'string') {
      sub[VALIDATION_JSON_PATH_KEY] = path;
    }

    const field = sub.field;
    if (field && typeof field === 'object' && !Array.isArray(field)) {
      if (field.type === 'FIELD_ARITHMETIC') {
        demoteAggregateFieldToPlainReveal(sub, path);
      }
    } else if (typeof field === 'string' && isResponseJsonPathString(field)) {
      sub.type = 'FIELD_REVEAL';
      sub.op = 'REVEAL_STRING';
      sub.field = path;
    }
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
    patchSubconditionForCursorDashboard(sub, responseRoot);
  }
}

/**
 * @param {unknown[]} formatResponse
 * @param {Record<string, unknown>} requestsMap
 * @param {Array<{ url?: string }> | undefined} templateRequests
 */
export function patchCursorDashboardFormatResponse(
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
