/* global AbortController, chrome, URL */
import {
  DEFAULT_AMAZON_CNEP_URL,
  AMAZON_GEO_FETCH_TIMEOUT_MS,
  AMAZON_STOREFRONT_BY_COUNTRY,
  CLOUDFLARE_TRACE_URLS,
  DEFAULT_AMAZON_COUNTRY_CODE,
  DEFAULT_AMAZON_STOREFRONT,
} from './constants';

function logAmazonGeo(level, reason, detail) {
  const prefix = `[amazon-geo:${reason}]`;
  if (level === 'warn') {
    console.warn(prefix, detail);
    return;
  }
  if (level === 'error') {
    console.error(prefix, detail);
    return;
  }
  console.log(prefix, detail);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = AMAZON_GEO_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeCountryCode(value) {
  const code = value?.toUpperCase?.() || String(value || '').toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function normalizeHostname(value) {
  return String(value || '').toLowerCase().replace(/^www\./, '');
}

export function getAmazonStorefrontConfig(countryCode) {
  return (
    AMAZON_STOREFRONT_BY_COUNTRY[countryCode] ||
    AMAZON_STOREFRONT_BY_COUNTRY[DEFAULT_AMAZON_COUNTRY_CODE] || {
      storefrontUrl: DEFAULT_AMAZON_STOREFRONT,
      cnepUrl: DEFAULT_AMAZON_CNEP_URL,
    }
  );
}

export function resolveAmazonCountryCodeFromUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
  try {
    const targetHostname = normalizeHostname(new URL(rawUrl).hostname);
    for (const [countryCode, config] of Object.entries(
      AMAZON_STOREFRONT_BY_COUNTRY
    )) {
      if (countryCode === DEFAULT_AMAZON_COUNTRY_CODE) continue;
      const storefrontHostname = normalizeHostname(
        new URL(config.storefrontUrl).hostname
      );
      if (targetHostname === storefrontHostname) return countryCode;
    }
  } catch (error) {
    logAmazonGeo('warn', 'jump_to_url_parse_failed', { rawUrl, error });
  }
  return null;
}

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

async function countryFromIpApiCom(ip) {
  const trimmed = ip != null && String(ip).trim() ? String(ip).trim() : '';
  const url = trimmed
    ? `http://ip-api.com/json/${encodeURIComponent(trimmed)}?fields=status,message,countryCode`
    : 'http://ip-api.com/json/?fields=status,message,countryCode';
  const response = await fetchWithTimeout(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 'success' || !data.countryCode) return null;
  return normalizeCountryCode(data.countryCode);
}

async function countryFromIpInfo() {
  const response = await fetchWithTimeout('https://ipinfo.io/json');
  if (!response.ok) return null;
  const data = await response.json();
  return normalizeCountryCode(data.country);
}

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
      func: async (timeoutMs) => {
        const normalize = (value) => {
          const code =
            value?.toUpperCase?.() || String(value || '').toUpperCase();
          return /^[A-Z]{2}$/.test(code) ? code : null;
        };
        const fetchWithTimeoutInPage = async (url) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          try {
            return await fetch(url, { signal: controller.signal });
          } finally {
            clearTimeout(timeoutId);
          }
        };

        try {
          const response = await fetchWithTimeoutInPage('https://ipapi.co/json/');
          if (response.ok) {
            const data = await response.json();
            if (!data.error) {
              const code = normalize(data.country_code);
              if (code) return code;
            }
          }
        } catch (_e) {
          /* CORS or network */
        }

        try {
          const response = await fetchWithTimeoutInPage('https://ipinfo.io/json');
          if (response.ok) {
            const data = await response.json();
            const code = normalize(data.country);
            if (code) return code;
          }
        } catch (_e) {
          /* CORS or network */
        }

        return null;
      },
      args: [AMAZON_GEO_FETCH_TIMEOUT_MS],
    });
    return normalizeCountryCode(result);
  } catch (error) {
    logAmazonGeo('warn', 'tab_fetch_failed', error);
    return null;
  }
}

async function resolveCountryCodeByProviders(tabId) {
  const fromTab = await getCountryCodeFromBrowserTab(tabId);
  if (fromTab) {
    logAmazonGeo('info', 'resolved_from_tab', fromTab);
    return fromTab;
  }

  for (const traceUrl of CLOUDFLARE_TRACE_URLS) {
    try {
      const response = await fetchWithTimeout(traceUrl);
      if (!response.ok) continue;
      const text = await response.text();
      const ip = ipFromCloudflareTrace(text);
      if (!ip) continue;
      const code = await countryFromIpApiCom(ip);
      if (code) {
        logAmazonGeo('info', 'resolved_from_trace_ip_api', {
          traceUrl,
          code,
        });
        return code;
      }
    } catch (error) {
      logAmazonGeo('warn', 'trace_lookup_failed', { traceUrl, error });
    }
  }

  try {
    const code = await countryFromIpApiCom();
    if (code) {
      logAmazonGeo('info', 'resolved_from_ip_api', code);
      return code;
    }
  } catch (error) {
    logAmazonGeo('warn', 'ip_api_failed', error);
  }

  try {
    const code = await countryFromIpInfo();
    if (code) {
      logAmazonGeo('info', 'resolved_from_ipinfo', code);
      return code;
    }
  } catch (error) {
    logAmazonGeo('warn', 'ipinfo_failed', error);
  }

  logAmazonGeo('warn', 'fallback_default_country', DEFAULT_AMAZON_COUNTRY_CODE);
  return DEFAULT_AMAZON_COUNTRY_CODE;
}

export async function getAmazonSiteByIP(tabId) {
  try {
    const amazonSite = await resolveAmazonSite(tabId);
    return amazonSite.storefrontUrl;
  } catch (error) {
    logAmazonGeo('error', 'storefront_resolution_failed', error);
    return DEFAULT_AMAZON_STOREFRONT;
  }
}

export async function resolveAmazonSite(tabId, preferredJumpToUrl) {
  try {
    const preferredCountryCode =
      resolveAmazonCountryCodeFromUrl(preferredJumpToUrl);
    const countryCode =
      preferredCountryCode || (await resolveCountryCodeByProviders(tabId));
    const selectedCountryCode = AMAZON_STOREFRONT_BY_COUNTRY[countryCode]
      ? countryCode
      : DEFAULT_AMAZON_COUNTRY_CODE;
    const { storefrontUrl, cnepUrl } =
      getAmazonStorefrontConfig(selectedCountryCode);

    logAmazonGeo('info', 'storefront_selected', {
      countryCode: selectedCountryCode,
      source: preferredCountryCode ? 'jumpToUrl' : 'ip',
      storefrontUrl,
      cnepUrl,
    });
    return {
      countryCode: selectedCountryCode,
      storefrontUrl,
      cnepUrl,
    };
  } catch (error) {
    logAmazonGeo('error', 'storefront_resolution_failed', error);
    const { storefrontUrl, cnepUrl } = getAmazonStorefrontConfig(
      DEFAULT_AMAZON_COUNTRY_CODE
    );
    return {
      countryCode: DEFAULT_AMAZON_COUNTRY_CODE,
      storefrontUrl,
      cnepUrl,
    };
  }
}
