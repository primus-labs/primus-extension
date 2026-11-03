/** Polymarket onboarding username/email fields (content script only — no background import). */

export const POLYMARKET_LOGIN_FORM_SELECTOR =
  'input[name="username"], input[name="email"]';

/**
 * @param {Document} [doc]
 * @returns {boolean}
 */
export function isPolymarketLoginFormVisibleInDocument(doc) {
  const root = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!root) return false;
  try {
    return root.querySelector(POLYMARKET_LOGIN_FORM_SELECTOR) != null;
  } catch (_e) {
    return false;
  }
}
