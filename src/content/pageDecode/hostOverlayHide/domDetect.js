import {
  TEMPLATE_ID_DREAMINA,
  TEMPLATE_ID_HAILUO_CREATION,
} from './templateIds.js';

/** Dreamina host dialog: all markers must appear on the same div (class tokens). */
export const DREAMINA_HOST_OVERLAY_CLASS_MARKERS = [
  'modal',
  'center',
  'zoomModal-enter-done',
];

const DREAMINA_HOST_OVERLAY_DIV_SELECTOR =
  'div[class*="modal"][class*="center"][class*="zoomModal-enter-done"]';

/**
 * @param {Element} el
 * @param {string} substring
 * @returns {boolean}
 */
export function classNameMatchesSubstring(el, substring) {
  if (!el?.classList || !substring) {
    return false;
  }
  const needle = String(substring).toLowerCase();
  for (const token of el.classList) {
    if (typeof token === 'string' && token.toLowerCase().includes(needle)) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Element} el
 * @param {string[]} markers
 * @returns {boolean}
 */
export function classListHaystackIncludesAll(el, markers) {
  if (!el?.classList || !Array.isArray(markers) || markers.length === 0) {
    return false;
  }
  const haystack = Array.from(el.classList).join(' ').toLowerCase();
  return markers.every((marker) =>
    haystack.includes(String(marker).toLowerCase())
  );
}

/**
 * @param {Element} el
 * @returns {boolean}
 */
export function isElementVisiblyPresent(el) {
  if (!el || el.isConnected === false) {
    return false;
  }
  if (typeof el.getBoundingClientRect !== 'function') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }
  if (typeof getComputedStyle === 'function') {
    const style = getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.pointerEvents !== 'none'
    );
  }
  return true;
}

/**
 * @param {Document} doc
 * @returns {boolean}
 */
export function hasVisibleHailuoFixedSection(doc) {
  const root = doc ?? document;
  try {
    for (const el of root.querySelectorAll('section')) {
      if (el.tagName !== 'SECTION') {
        continue;
      }
      if (
        classNameMatchesSubstring(el, 'fixed') &&
        isElementVisiblyPresent(el)
      ) {
        return true;
      }
    }
  } catch (_e) {
    return false;
  }
  return false;
}

/**
 * @param {Document} doc
 * @returns {boolean}
 */
export function hasVisibleDreaminaModalDiv(doc) {
  const root = doc ?? document;
  try {
    for (const el of root.querySelectorAll(DREAMINA_HOST_OVERLAY_DIV_SELECTOR)) {
      if (el.tagName !== 'DIV') {
        continue;
      }
      if (
        !classListHaystackIncludesAll(el, DREAMINA_HOST_OVERLAY_CLASS_MARKERS)
      ) {
        continue;
      }
      if (isElementVisiblyPresent(el)) {
        return true;
      }
    }
  } catch (_e) {
    return false;
  }
  return false;
}

/**
 * Whether a visible host overlay should hide the page-decode modal.
 *
 * @param {string | null | undefined} templateId normalized lowercase id
 * @param {Document} [doc]
 * @returns {boolean}
 */
export function isHostOverlayVisiblyPresent(templateId, doc) {
  if (!templateId) {
    return false;
  }
  if (templateId === TEMPLATE_ID_HAILUO_CREATION) {
    return hasVisibleHailuoFixedSection(doc);
  }
  if (templateId === TEMPLATE_ID_DREAMINA) {
    return hasVisibleDreaminaModalDiv(doc);
  }
  return false;
}
