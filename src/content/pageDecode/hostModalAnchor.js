/**
 * Locate a host-page modal and compute extension card position beside it.
 */

const DEFAULT_GAP_PX = 16;
const MIN_HOST_SIZE_PX = 120;

/**
 * @param {string} extensionContainerId
 * @returns {HTMLElement | null}
 */
function getExtensionContainer(extensionContainerId) {
  if (!extensionContainerId) return null;
  const el = document.getElementById(extensionContainerId);
  return el instanceof HTMLElement ? el : null;
}

/**
 * @param {Element} el
 * @param {HTMLElement | null} extensionRoot
 * @returns {boolean}
 */
function isVisibleHostCandidate(el, extensionRoot) {
  if (!(el instanceof HTMLElement)) return false;
  if (extensionRoot && extensionRoot.contains(el)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < MIN_HOST_SIZE_PX || rect.height < MIN_HOST_SIZE_PX) return false;
  if (rect.bottom <= 0 || rect.right <= 0) return false;
  if (rect.top >= window.innerHeight || rect.left >= window.innerWidth) return false;
  return true;
}

/**
 * @param {HTMLElement} el
 * @param {string[] | undefined} matchText
 * @returns {boolean}
 */
function elementMatchesText(el, matchText) {
  if (!Array.isArray(matchText) || matchText.length === 0) return true;
  const text = el.textContent || '';
  return matchText.some((snippet) => text.includes(snippet));
}

/**
 * @param {{ selectors?: string[]; matchText?: string[] } | null | undefined} anchorConfig
 * @param {string} extensionContainerId
 * @returns {HTMLElement | null}
 */
export function findHostModalElement(anchorConfig, extensionContainerId) {
  if (!anchorConfig) return null;
  const extensionRoot = getExtensionContainer(extensionContainerId);
  const selectors = Array.isArray(anchorConfig.selectors)
    ? anchorConfig.selectors
    : ['[role="dialog"][data-state="open"]'];

  /** @type {HTMLElement[]} */
  const candidates = [];

  for (const selector of selectors) {
    if (typeof selector !== 'string' || !selector.trim()) continue;
    try {
      document.querySelectorAll(selector).forEach((node) => {
        if (node instanceof HTMLElement) candidates.push(node);
      });
    } catch (_e) {
      /* invalid selector */
    }
  }

  const visible = candidates.filter(
    (el) =>
      isVisibleHostCandidate(el, extensionRoot) &&
      elementMatchesText(el, anchorConfig.matchText)
  );

  if (visible.length === 0) return null;

  visible.sort((a, b) => {
    const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
    const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
    return areaB - areaA;
  });

  return visible[0];
}

/**
 * @param {{
 *   root: HTMLElement;
 *   group: HTMLElement;
 *   host: HTMLElement;
 *   gap?: number;
 *   cardWidth?: number;
 *   edgePadding?: number;
 * }} params
 * @returns {{ x: number; y: number } | null}
 */
export function computePositionBesideHostModal({
  root,
  group,
  host,
  gap = DEFAULT_GAP_PX,
  cardWidth = 294,
  edgePadding = 16,
}) {
  const rootRect = root.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const groupW = group.offsetWidth || cardWidth;
  const groupH = group.offsetHeight || 400;

  let x = hostRect.right - rootRect.left + gap;
  let y =
    hostRect.top +
    (hostRect.height - groupH) / 2 -
    rootRect.top;

  const maxX = Math.max(edgePadding, rootRect.width - groupW - edgePadding);
  const maxY = Math.max(edgePadding, rootRect.height - groupH - edgePadding);

  x = Math.min(Math.max(edgePadding, x), maxX);
  y = Math.min(Math.max(edgePadding, y), maxY);

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}
