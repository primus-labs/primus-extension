/**
 * Spotify Web Player: data source opened at open.spotify.com (e.g. jumpTo).
 * Use dark modal chrome so the attestation popup matches the host page.
 */

const SPOTIFY_WEB_PLAYER_ORIGIN = 'https://open.spotify.com';

/**
 * @param {string} [href] - Typically `window.location.href` on the data source tab
 * @returns {boolean}
 */
export function shouldUseDarkModalForSpotifyDataSourceUrl(href) {
  if (!href || typeof href !== 'string') return false;
  const h = href.toLowerCase();
  return (
    h.startsWith(`${SPOTIFY_WEB_PLAYER_ORIGIN}/`) ||
    h === SPOTIFY_WEB_PLAYER_ORIGIN
  );
}
