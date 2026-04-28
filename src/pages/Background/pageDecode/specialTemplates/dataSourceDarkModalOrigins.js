/**
 * Data-source pages that use a dark host UI get the black modal chrome (`pado-page-decode-theme--black`).
 *
 * Append new **`https://` origins** here (no path, no trailing slash). Matching uses prefix + `/` or exact origin equality.
 */

export const DATA_SOURCE_DARK_MODAL_ORIGINS = [
  'https://open.spotify.com',
  'https://store.steampowered.com',
];

/**
 * @param {string} [href] - Typically `window.location.href` on the data source tab
 * @returns {boolean}
 */
export function shouldUseDarkModalForDataSourceUrl(href) {
  if (!href || typeof href !== 'string') return false;
  const h = href.trim().toLowerCase();
  for (const origin of DATA_SOURCE_DARK_MODAL_ORIGINS) {
    const o = origin.toLowerCase();
    if (h === o || h.startsWith(`${o}/`)) return true;
  }
  return false;
}
