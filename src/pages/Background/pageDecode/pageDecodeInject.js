/**
 * When to re-inject pageDecode on tabs.onUpdated (avoid title/url-only SPA churn).
 */

/** Isolated-world flag set by pageDecode.bundle.js on first boot per document. */
export const PAGE_DECODE_BOOT_GLOBAL = '__PADO_PAGE_DECODE_BOOTED__';

/**
 * @param {{ url?: string; title?: string; status?: string } | null | undefined} changeInfo
 * @returns {boolean}
 */
export function shouldInjectPageDecodeOnTabUpdate(changeInfo) {
  if (!changeInfo || changeInfo.status !== 'complete') {
    return false;
  }
  return true;
}
