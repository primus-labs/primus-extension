import { safeStorageGet } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';

const INTER_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap';

export const injectFont = () => {
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = INTER_FONT_URL;
  if (document.head) {
    document.head.appendChild(linkElement);
  }
};

export function createDomElement(html) {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}

const HOST_THEME_ROOT_SELECTORS = [
  '#root',
  '#app',
  '#__next',
  '#__nuxt',
  '#___gatsby',
  '[data-reactroot]',
];

const HOST_THEME_ATTRIBUTE_NAMES = [
  'data-theme',
  'data-mode',
  'data-color-mode',
  'data-color-scheme',
];

function normalizeThemeValue(value) {
  try {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  } catch (_e) {
    return '';
  }
}

function resolveThemeFromText(value) {
  try {
    const normalized = normalizeThemeValue(value);
    if (!normalized) return '';
    if (
      normalized === 'dark' ||
      normalized.includes('theme-dark') ||
      /(^|[\s_-])dark($|[\s_-])/.test(normalized)
    ) {
      return 'dark';
    }
    if (
      normalized === 'light' ||
      normalized.includes('theme-light') ||
      /(^|[\s_-])light($|[\s_-])/.test(normalized)
    ) {
      return 'light';
    }
    return '';
  } catch (_e) {
    return '';
  }
}

function resolveThemeFromElement(element) {
  try {
    if (!element) return '';

    const className =
      typeof element.className === 'string'
        ? element.className
        : element.getAttribute?.('class') || '';
    const classTheme = resolveThemeFromText(className);
    if (classTheme) return classTheme;

    for (const attrName of HOST_THEME_ATTRIBUTE_NAMES) {
      const attrValue = element.getAttribute?.(attrName);
      const attrTheme = resolveThemeFromText(attrValue);
      if (attrTheme) return attrTheme;
    }

    return '';
  } catch (_e) {
    return '';
  }
}

function getHostThemeCandidateElements() {
  const elements = [];
  try {
    if (typeof document === 'undefined') return elements;

    if (document.documentElement) {
      elements.push(document.documentElement);
    }
    if (document.body) {
      elements.push(document.body);
    }

    for (const selector of HOST_THEME_ROOT_SELECTORS) {
      try {
        const element = document.querySelector(selector);
        if (element && !elements.includes(element)) {
          elements.push(element);
        }
      } catch (_e) {
        // Ignore invalid selector/query issues to avoid affecting host pages.
      }
    }

    return elements;
  } catch (_e) {
    return elements;
  }
}

export function detectHostTheme() {
  try {
    const themeCandidates = getHostThemeCandidateElements();
    for (const element of themeCandidates) {
      const theme = resolveThemeFromElement(element);
      if (theme === 'dark' || theme === 'light') {
        return theme;
      }
    }
  } catch (_e) {
    // Fall through to media query detection, then final light fallback.
  }

  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'light';
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (!mediaQuery || typeof mediaQuery.matches !== 'boolean') {
      return 'light';
    }

    return mediaQuery.matches ? 'dark' : 'light';
  } catch (_e) {
    return 'light';
  }
}

export const request = async (fetchParams, baseUrl, padoExtensionVersion) => {
  let { method, url, data = {}, config } = fetchParams;
  method = method.toUpperCase();
  url = url.startsWith('http') || url.startsWith('https') ? url : baseUrl + url;

  if (method === 'GET') {
    let dataStr = '';
    Object.keys(data).forEach((key) => {
      dataStr += key + '=' + data[key] + '&';
    });
    if (dataStr !== '') {
      dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'));
      url = url + '?' + dataStr;
    }
  }
  let golbalHeader = {
    'client-type': 'WEB',
    'client-version': padoExtensionVersion,
  };
  const { userInfo } = await safeStorageGet(['userInfo']);
  if (userInfo) {
    const userInfoObj = safeJsonParse(userInfo, { id: '', token: '' }) || { id: '', token: '' };
    const { id, token } = userInfoObj;
    if (
      !url.startsWith('https://storage.googleapis.com/primuslabs-online') &&
      token
    ) {
      golbalHeader.Authorization = `Bearer ${token}`;
    }
    if (url.includes('/public/event/report')) {
      golbalHeader['user-id'] = id;
    }
  }
  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = config?.timeout ?? 60000;
  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, timeout);
  let requestConfig = {
    credentials: 'same-origin',
    method: method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...golbalHeader,

      ...config?.extraHeader,
    },
    mode: 'cors', //  same-origin | no-cors（default）|cores;
    cache: config?.cache ?? 'default', //  default | no-store | reload | no-cache | force-cache | only-if-cached 。
    signal: signal,
  };

  if (method === 'POST') {
    Object.defineProperty(requestConfig, 'body', {
      value: JSON.stringify(data),
    });
  }
  try {
    const response = await fetch(url, requestConfig);
    const responseJson = await response.json();
    clearTimeout(timeoutTimer);
    return responseJson;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`fetch ${url} timeout`);
    } else {
      throw new Error(error);
    }
  } finally {
    clearTimeout(timeoutTimer);
  }
};

export const eventReport = async (data, baseUrl, padoExtensionVersion) => {
  const storedata = {
    eventType: data.eventType,
    ...(data.rawData && { rawData: JSON.stringify(data.rawData) }),
  };
  return request(
    {
      method: 'post',
      url: '/public/event/report',
      data: storedata,
    },
    baseUrl,
    padoExtensionVersion
  );
};
