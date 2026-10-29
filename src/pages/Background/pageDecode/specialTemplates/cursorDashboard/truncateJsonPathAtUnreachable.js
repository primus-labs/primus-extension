import jp from 'jsonpath';
import { parseJsonPathStepsAfterRoot } from '../emptyArrayJsonPathTruncate/truncateAtEmptyArray.js';

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Truncate JSONPath when the next segment is unreachable: missing property,
 * undefined/null, non-array before index, empty array, or out-of-range index.
 *
 * @param {string} pathExpr
 * @param {unknown} rootData
 * @returns {{ path: string, truncated: boolean }}
 */
export function truncateJsonPathAtUnreachable(pathExpr, rootData) {
  if (typeof pathExpr !== 'string' || !pathExpr.trim()) {
    return { path: pathExpr, truncated: false };
  }
  const trimmed = pathExpr.trim();
  const steps = parseJsonPathStepsAfterRoot(trimmed);
  if (!steps) {
    return { path: trimmed, truncated: false };
  }

  let queryPath = '$';
  let originalPath = '$';

  for (const step of steps) {
    let nodes;
    try {
      nodes = jp.query(rootData, queryPath);
    } catch {
      return { path: originalPath, truncated: true };
    }
    if (!nodes.length) {
      return { path: originalPath, truncated: true };
    }

    const current = nodes[0];

    if (step.type === 'prop') {
      if (!isPlainObject(current)) {
        return { path: originalPath, truncated: true };
      }
      if (
        !Object.prototype.hasOwnProperty.call(current, step.name) ||
        current[step.name] === undefined
      ) {
        return { path: originalPath, truncated: true };
      }
      queryPath += `.${step.name}`;
      originalPath += `.${step.name}`;
      continue;
    }

    if (!Array.isArray(current)) {
      return { path: originalPath, truncated: true };
    }
    if (current.length === 0) {
      return { path: originalPath, truncated: true };
    }

    let idx = step.index;
    if (idx < 0) {
      idx = current.length + idx;
    }
    if (idx < 0 || idx >= current.length) {
      return { path: originalPath, truncated: true };
    }

    queryPath += `[${idx}]`;
    originalPath += `[${step.raw}]`;
  }

  return { path: trimmed, truncated: false };
}

/**
 * @param {string} pathExpr
 * @param {unknown} rootData
 * @returns {string}
 */
export function resolveJsonPathWithUnreachableTruncate(pathExpr, rootData) {
  return truncateJsonPathAtUnreachable(pathExpr, rootData).path;
}
