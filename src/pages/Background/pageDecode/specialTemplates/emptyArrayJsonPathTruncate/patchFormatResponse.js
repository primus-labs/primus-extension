import { VALIDATION_JSON_PATH_KEY } from '../../../padoZKAttestationJSSDK/buildAggregateSubcondition.js';
import { truncateJsonPathAtEmptyArray } from './truncateAtEmptyArray.js';

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
 * @param {string} pathExpr
 * @param {unknown} rootData
 * @returns {string}
 */
function patchPath(pathExpr, rootData) {
  if (!isResponseJsonPathString(pathExpr)) {
    return pathExpr;
  }
  const { path, truncated } = truncateJsonPathAtEmptyArray(pathExpr, rootData);
  return truncated ? path : pathExpr;
}

/**
 * @param {unknown} subfieldItem
 * @param {string} pathPrefix
 * @param {unknown} rootData
 */
function patchArithmeticSubfieldItem(subfieldItem, pathPrefix, rootData) {
  if (typeof subfieldItem === 'string') {
    if (subfieldItem.startsWith('+.')) {
      return subfieldItem;
    }
    return patchPath(subfieldItem, rootData);
  }
  if (
    subfieldItem &&
    typeof subfieldItem === 'object' &&
    subfieldItem.type === 'FIELD_ARITHMETIC'
  ) {
    patchArithmeticFieldNode(subfieldItem, pathPrefix, rootData);
  }
  return subfieldItem;
}

/**
 * @param {Record<string, unknown>} node
 * @param {string} [pathPrefix]
 * @param {unknown} rootData
 */
function patchArithmeticFieldNode(node, pathPrefix, rootData) {
  if (!node || typeof node !== 'object') {
    return;
  }
  const field = node.field;
  if (typeof field === 'string') {
    if (field.includes('[*]')) {
      return;
    }
    const patched = patchPath(field, rootData);
    node.field = patched;
    pathPrefix = patched.replace(/\[\*\]\+$/, '[0]');
  }

  const subfields = node.subfields;
  if (!Array.isArray(subfields)) {
    return;
  }
  for (let i = 0; i < subfields.length; i += 1) {
    subfields[i] = patchArithmeticSubfieldItem(
      subfields[i],
      pathPrefix || '',
      rootData
    );
  }
}

/**
 * @param {Record<string, unknown>} sub
 * @param {unknown} rootData
 */
function patchSubcondition(sub, rootData) {
  if (!sub || typeof sub !== 'object') {
    return;
  }

  if (sub.op === 'MATCH_ONE') {
    if (typeof sub.field === 'string') {
      sub.field = patchPath(sub.field, rootData);
    }
    const nested = sub.subconditions;
    if (Array.isArray(nested)) {
      for (const item of nested) {
        patchSubcondition(item, rootData);
      }
    }
    return;
  }

  const validationAnchor = sub[VALIDATION_JSON_PATH_KEY];
  if (typeof validationAnchor === 'string') {
    sub[VALIDATION_JSON_PATH_KEY] = patchPath(validationAnchor, rootData);
  }

  const field = sub.field;
  if (typeof field === 'string') {
    if (!field.includes('[*]')) {
      sub.field = patchPath(field, rootData);
    }
  } else if (field && typeof field === 'object' && !Array.isArray(field)) {
    patchArithmeticFieldNode(field, undefined, rootData);
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
  if (Array.isArray(subs)) {
    for (const sub of subs) {
      patchSubcondition(sub, responseRoot);
    }
  }
  const plaintextOutputs = resp?.plaintext_outputs;
  if (Array.isArray(plaintextOutputs)) {
    for (const out of plaintextOutputs) {
      if (typeof out?.field === 'string') {
        out.field = patchPath(out.field, responseRoot);
      }
    }
  }
}

/**
 * Replay body for a datasource template request row (same slot as responses[i]).
 *
 * @param {Record<string, unknown>} requestsMap
 * @param {string | undefined} templateRequestUrl
 * @returns {unknown | null}
 */
export function getResponseDataForTemplateRequestUrl(
  requestsMap,
  templateRequestUrl
) {
  if (
    !requestsMap ||
    typeof requestsMap !== 'object' ||
    typeof templateRequestUrl !== 'string' ||
    !templateRequestUrl
  ) {
    return null;
  }
  const entry = Object.values(requestsMap).find(
    (s) =>
      s?.templateRequestUrl === templateRequestUrl &&
      s?.isTarget === 1 &&
      s?.responseData != null
  );
  return entry?.responseData ?? null;
}

/**
 * Patch algorithm response subconditions so JSONPaths end at the last reachable node
 * when the next array index would hit an empty array.
 *
 * Each formatResponse[i] uses the replay JSON for datasource requests[i] when available.
 *
 * @param {unknown[]} formatResponse
 * @param {Record<string, unknown>} requestsMap
 * @param {Array<{ url?: string }> | undefined} templateRequests
 */
export function patchFormatResponseJsonPathsForEmptyArrayTruncate(
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

/**
 * @param {Record<string, unknown>} requestsMap
 * @returns {unknown | null}
 */
export function getTargetResponseDataFromRequestsMap(requestsMap) {
  if (!requestsMap || typeof requestsMap !== 'object') {
    return null;
  }
  const target = Object.values(requestsMap).find(
    (entry) => entry?.isTarget === 1 && entry?.responseData != null
  );
  return target?.responseData ?? null;
}
