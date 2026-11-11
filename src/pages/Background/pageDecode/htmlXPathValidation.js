/**
 * HTML XPath validation helpers (webpack + unit tests).
 */
import { resolveJsonPathForValidation } from '../padoZKAttestationJSSDK/buildAggregateSubcondition.js';
import { validateXPathWithLibs } from './htmlXPathValidationCore.cjs';

export { validateXPathWithLibs };

/**
 * @param {unknown[]} jsonPathArr
 * @returns {string[]}
 */
export function collectXPathExpressionsForHtmlValidation(jsonPathArr) {
  if (!Array.isArray(jsonPathArr)) {
    return [];
  }
  /** @type {string[]} */
  const out = [];
  for (const item of jsonPathArr) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.startsWith('/') || trimmed.startsWith('(')) {
        out.push(trimmed);
      }
      continue;
    }
    const resolved = resolveJsonPathForValidation(item);
    if (
      typeof resolved === 'string' &&
      (resolved.startsWith('/') || resolved.startsWith('('))
    ) {
      out.push(resolved);
    }
  }
  return out;
}

/** Check if HTML response matches template conditions (XPath). */
export const validateHtmlResponseCondition = (jsonPathArr, html) => {
  const xpathItems = collectXPathExpressionsForHtmlValidation(jsonPathArr);
  if (xpathItems.length === 0) {
    return false;
  }
  const isMatch = xpathItems.every((jpItem) => {
    try {
      const itemMatch = validateXPathWithLibs(html, jpItem);
      return itemMatch && itemMatch.length > 0;
    } catch {
      return false;
    }
  });
  return isMatch;
};
