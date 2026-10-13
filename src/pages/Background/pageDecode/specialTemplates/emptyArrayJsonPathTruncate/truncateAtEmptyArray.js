import jp from 'jsonpath';

/**
 * @typedef {{ type: 'index', index: number, raw: string } | { type: 'prop', name: string }} JsonPathStep
 */

/**
 * @param {string} pathExpr
 * @returns {JsonPathStep[] | null}
 */
export function parseJsonPathStepsAfterRoot(pathExpr) {
  if (typeof pathExpr !== 'string' || !pathExpr.startsWith('$')) {
    return null;
  }
  const steps = [];
  let i = 1;
  const s = pathExpr;
  while (i < s.length) {
    if (s[i] === '.') {
      const m = s.slice(i).match(/^\.([a-zA-Z_][\w$]*)/);
      if (!m) {
        return null;
      }
      steps.push({ type: 'prop', name: m[1] });
      i += m[0].length;
    } else if (s[i] === '[') {
      const m = s.slice(i).match(/^\[(-?\d+)\]/);
      if (!m) {
        return null;
      }
      steps.push({ type: 'index', index: parseInt(m[1], 10), raw: m[1] });
      i += m[0].length;
    } else {
      return null;
    }
  }
  return steps;
}

/**
 * When the next segment indexes into an empty array (or index is out of range),
 * truncate the path to the prefix before that index — e.g.
 * `$[2][1].pnlHistory[-1][1]` → `$[2]` if `$[2]` is `[]`, or → `$[2][1].pnlHistory` if `pnlHistory` is `[]`.
 *
 * @param {string} pathExpr
 * @param {unknown} rootData
 * @returns {{ path: string, truncated: boolean }}
 */
export function truncateJsonPathAtEmptyArray(pathExpr, rootData) {
  if (typeof pathExpr !== 'string' || !pathExpr.trim()) {
    return { path: pathExpr, truncated: false };
  }
  const trimmed = pathExpr.trim();
  const steps = parseJsonPathStepsAfterRoot(trimmed);
  if (!steps) {
    return { path: trimmed, truncated: false };
  }

  /** @type {string} Query path with positive indices only (for jp.query). */
  let queryPath = '$';
  /** @type {string} Path preserving configured bracket notation (e.g. [-1]). */
  let originalPath = '$';

  for (const step of steps) {
    if (step.type === 'prop') {
      queryPath += `.${step.name}`;
      originalPath += `.${step.name}`;
      continue;
    }

    let nodes;
    try {
      nodes = jp.query(rootData, queryPath);
    } catch {
      return { path: originalPath, truncated: true };
    }
    if (!nodes.length) {
      return { path: originalPath, truncated: true };
    }

    const container = nodes[0];
    if (!Array.isArray(container)) {
      return { path: trimmed, truncated: false };
    }
    if (container.length === 0) {
      return { path: originalPath, truncated: true };
    }

    let idx = step.index;
    if (idx < 0) {
      idx = container.length + idx;
    }
    if (idx < 0 || idx >= container.length) {
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
export function resolveJsonPathWithEmptyArrayTruncate(pathExpr, rootData) {
  return truncateJsonPathAtEmptyArray(pathExpr, rootData).path;
}
