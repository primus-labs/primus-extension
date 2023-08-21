import { PADOSERVERURL } from '@/config/envConstants';
import {DEFAULTFETCHTIMEOUT} from '@/config/constants'
type FetchParams = {
  method: string;
  url: string;
  data?: any;
  config?: any;
};

const request = async (fetchParams: FetchParams) => {
  let { method, url, data = {}, config } = fetchParams;
  const baseUrl = PADOSERVERURL;
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
  let golbalHeader: any = {};
  const { userInfo } = await chrome.storage.local.get(['userInfo']);
  if (userInfo) {
    const userInfoObj = JSON.parse(userInfo);
    const { id, token } = userInfoObj;
    if (!url.includes('/public') && !url.startsWith('https://pado-online.s3.ap-northeast-1.amazonaws.com') && token) {
      golbalHeader.Authorization = `Bearer ${token}`;
    }
    if (url.includes('/public/event/report')) {
      golbalHeader['user-id'] = id;
    }
  }
  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = config?.timeout ?? DEFAULTFETCHTIMEOUT;
  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, timeout);
  let requestConfig: any = {
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
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log(`fetch ${url} timeout`);
    } else {
      throw new Error(error);
    }
    
  } finally {
    clearTimeout(timeoutTimer);
  }
};
export default request;
