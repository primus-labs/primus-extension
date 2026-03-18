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
