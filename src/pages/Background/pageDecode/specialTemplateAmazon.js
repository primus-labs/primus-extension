/**
 * Amazon storefront helpers: resolve site from IP and rewrite jumpTo for a fixed template id.
 */

import { getPageDecodeState } from './state';

export const AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID =
  '9119207f-5884-403d-8bb3-1b6870d428fe';

/** Same `loc=XX` format; try 1.1.1.1 first (minimal surface vs www). */
const CLOUDFLARE_TRACE_URLS = [
  'https://1.1.1.1/cdn-cgi/trace',
  'https://www.cloudflare.com/cdn-cgi/trace',
];

/**
 * Public IP from Cloudflare trace (`ip=...`). `loc=` is often a 3-letter colo/airport code, not ISO country.
 * @param {string} text
 * @returns {string|null}
 */
function ipFromCloudflareTrace(text) {
  if (typeof text !== 'string') return null;
  for (const line of text.split('\n')) {
    if (line.startsWith('ip=')) {
      const ip = line.slice(3).trim();
      if (ip) return ip;
    }
  }
  return null;
}

/**
 * ip-api.com free JSON is HTTP-only; extension fetch is OK with host_permissions.
 * @returns {Promise<string|null>}
 */
async function countryFromIpApiCom(ip) {
  const trimmed = ip != null && String(ip).trim() ? String(ip).trim() : '';
  const url = trimmed
    ? `http://ip-api.com/json/${encodeURIComponent(trimmed)}?fields=status,message,countryCode`
    : 'http://ip-api.com/json/?fields=status,message,countryCode';
  const r = await fetch(url);
  if (!r.ok) return null;
  const data = await r.json();
  if (data.status !== 'success' || !data.countryCode) return null;
  const code = String(data.countryCode).toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * ipinfo.io returns { country: "US", ... } on /json (rate-limited, no key).
 * @returns {Promise<string|null>}
 */
async function countryFromIpInfo() {
  const r = await fetch('https://ipinfo.io/json');
  if (!r.ok) return null;
  const data = await r.json();
  const code = data.country?.toUpperCase?.() || String(data.country || '').toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * Same network path as typing a URL in the tab: respects system VPN / proxy. Service worker fetch often does not.
 * @param {number|undefined} tabId Active tab (e.g. dApp or extension UI) before opening Amazon.
 * @returns {Promise<string|null>} ISO country or null
 */
async function getCountryCodeFromBrowserTab(tabId) {
  if (tabId == null || typeof tabId !== 'number') return null;
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('devtools://')) {
      return null;
    }
  } catch (_e) {
    return null;
  }

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      injectImmediately: true,
      func: async () => {
        const norm = (c) =>
          c && /^[A-Za-z]{2}$/.test(String(c)) ? String(c).toUpperCase() : null;
        try {
          const r1 = await fetch('https://ipapi.co/json/');
          if (r1.ok) {
            const d = await r1.json();
            if (!d.error) {
              const c = norm(d.country_code);
              if (c) return c;
            }
          }
        } catch (_e) {
          /* CORS or network */
        }
        try {
          const r2 = await fetch('https://ipinfo.io/json');
          if (r2.ok) {
            const d = await r2.json();
            const c = norm(d.country);
            if (c) return c;
          }
        } catch (_e) {
          /* CORS or network */
        }
        return null;
      },
    });
    return result && /^[A-Z]{2}$/.test(result) ? result : null;
  } catch (e) {
    console.warn('Amazon IP geolocation (tab MAIN fetch) failed:', e);
    return null;
  }
}

/**
 * Resolve ISO country code. Prefer tab-context fetch (VPN-aligned); else SW + trace IP -> ip-api.
 * @param {number|undefined} tabId
 * @returns {Promise<string>} Uppercase country code or 'DEFAULT'
 */
async function getCountryCodeByIP(tabId) {
  const fromTab = await getCountryCodeFromBrowserTab(tabId);
  if (fromTab) {
    console.log(`Amazon IP geolocation (active tab, VPN-aligned): ${fromTab}`);
    return fromTab;
  }

  for (const traceUrl of CLOUDFLARE_TRACE_URLS) {
    try {
      const r = await fetch(traceUrl);
      if (!r.ok) continue;
      const text = await r.text();
      const ip = ipFromCloudflareTrace(text);
      if (ip) {
        const code = await countryFromIpApiCom(ip);
        if (code) {
          console.log(
            `Amazon IP geolocation (Cloudflare ip + ip-api.com ${traceUrl}): ${code}`
          );
          return code;
        }
      }
    } catch (e) {
      console.warn(`Amazon IP geolocation (Cloudflare trace) failed (${traceUrl}):`, e);
    }
  }

  try {
    const code = await countryFromIpApiCom();
    if (code) {
      console.log('Amazon IP geolocation (ip-api.com caller IP):', code);
      return code;
    }
  } catch (e) {
    console.warn('Amazon IP geolocation (ip-api.com) failed:', e);
  }

  try {
    const code = await countryFromIpInfo();
    if (code) {
      console.log(`Amazon IP geolocation (ipinfo.io): ${code}`);
      return code;
    }
  } catch (e) {
    console.warn('Amazon IP geolocation (ipinfo.io) failed:', e);
  }

  return 'DEFAULT';
}

/**
 * Resolve Amazon storefront base URL from the user's IP / VPN egress.
 * @param {number|undefined} tabId Active tab id for VPN-aligned lookup (see getCountryCodeByIP).
 * @returns {Promise<string>} Base URL e.g. https://www.amazon.co.jp
 */
export async function getAmazonSiteByIP(tabId) {
  const countryToAmazon = {
    US: 'https://www.amazon.com',
    CA: 'https://www.amazon.ca',
    MX: 'https://www.amazon.com.mx',
    GB: 'https://www.amazon.co.uk',
    DE: 'https://www.amazon.de',
    FR: 'https://www.amazon.fr',
    IT: 'https://www.amazon.it',
    ES: 'https://www.amazon.es',
    NL: 'https://www.amazon.nl',
    SE: 'https://www.amazon.se',
    PL: 'https://www.amazon.pl',
    BE: 'https://www.amazon.com.be',
    TR: 'https://www.amazon.com.tr',
    JP: 'https://www.amazon.co.jp',
    AU: 'https://www.amazon.com.au',
    SG: 'https://www.amazon.sg',
    IN: 'https://www.amazon.in',
    CN: 'https://www.amazon.cn',
    TW: 'https://www.amazon.com.tw',
    AE: 'https://www.amazon.ae',
    SA: 'https://www.amazon.sa',
    EG: 'https://www.amazon.eg',
    BR: 'https://www.amazon.com.br',
    DEFAULT: 'https://www.amazon.com',
  };

  try {
    const countryCode = await getCountryCodeByIP(tabId);
    const amazonUrl =
      countryToAmazon[countryCode] || countryToAmazon.DEFAULT;
    console.log(
      `Amazon storefront from IP: country ${countryCode} -> ${amazonUrl}`
    );
    return amazonUrl;
  } catch (error) {
    console.error('getAmazonSiteByIP failed:', error);
    return countryToAmazon.DEFAULT;
  }
}

/**
 * Replace jumpTo origin with amazonBaseUrl; keep path, query, and hash.
 * @param {string} jumpTo
 * @param {string} amazonBaseUrl
 * @returns {string}
 */
function rewriteAmazonJumpToOrigin(jumpTo, amazonBaseUrl) {
  try {
    const parsed = new URL(jumpTo);
    const base = amazonBaseUrl.replace(/\/+$/, '');
    return new URL(parsed.pathname + parsed.search + parsed.hash, base).href;
  } catch (_e) {
    return jumpTo;
  }
}

/**
 * True if URL host looks like an Amazon storefront (www.amazon.xx / smile, etc.).
 * @param {string} url
 */
function isAmazonStorefrontUrl(url) {
  try {
    return new URL(url).hostname.includes('amazon.');
  } catch (_e) {
    return false;
  }
}

/**
 * For algorithm params: rewrite `needCapture: false` request URLs to the resolved storefront
 * (same origin swap as jumpTo). Uses {@link getPageDecodeState}.state.resolvedAmazonStorefrontBaseUrl.
 * @param {object[]} formatRequests Built request list (mutated in place).
 * @param {object} activeTemplate
 */
/**
 * For Amazon account-manage template, algorithm `host` must match the resolved storefront
 * (e.g. www.amazon.sg), not the template default (e.g. www.amazon.co.jp).
 * @param {object} activeTemplate
 * @returns {string|null} Hostname without port, or null if N/A.
 */
export function getAmazonHostOverrideForAlgorithmParams(activeTemplate) {
  const templateId =
    activeTemplate?.attTemplateID ?? activeTemplate?.id;
  if (templateId !== AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID) return null;

  const base = getPageDecodeState().state.resolvedAmazonStorefrontBaseUrl;
  if (typeof base !== 'string' || !base.trim()) return null;
  try {
    return new URL(base).hostname;
  } catch (_e) {
    return null;
  }
}

export function rewriteAmazonNoCaptureRequestUrlsForAlgorithmParams(
  formatRequests,
  activeTemplate
) {
  const templateId =
    activeTemplate?.attTemplateID ?? activeTemplate?.id;
  if (templateId !== AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID) return;

  const base = getPageDecodeState().state.resolvedAmazonStorefrontBaseUrl;
  if (typeof base !== 'string' || !base.trim()) return;

  for (const fr of formatRequests) {
    if (fr.needCapture !== false) continue;
    const rawUrl = fr.url;
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
    if (!isAmazonStorefrontUrl(rawUrl)) continue;
    fr.url = rewriteAmazonJumpToOrigin(rawUrl, base);
  }
}

/**
 * For the Amazon account-manage template, set activeTemplate.jumpTo to the IP-matched storefront.
 * @param {object} activeTemplate
 * @param {number|undefined} browserTabId Active tab (before Amazon tab opens) for VPN-aligned geo.
 */
export async function applyAmazonSiteJumpToIfNeeded(
  activeTemplate,
  browserTabId
) {
  const templateId =
    activeTemplate?.attTemplateID ?? activeTemplate?.id;
  if (templateId !== AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID) return;

  const amazonBase = await getAmazonSiteByIP(browserTabId);
  getPageDecodeState().state.resolvedAmazonStorefrontBaseUrl = amazonBase;

  const jumpTo = activeTemplate?.jumpTo;
  if (typeof jumpTo !== 'string' || !jumpTo.trim()) return;

  activeTemplate.jumpTo = rewriteAmazonJumpToOrigin(jumpTo, amazonBase);
}
