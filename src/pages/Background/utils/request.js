/**
 * Lightweight fetch wrapper for background scripts (page decode, devconsole).
 * Use for arbitrary URLs without auth. For extension API calls with auth/version headers,
 * use @/utils/request (src/utils/request.ts) instead.
 */
import { isJSONString, encodeFormData } from './utils';

function normalizeCustomFetchParams({ url, method, body, header, isFormData }) {
  return { url, method, body, header: header || {}, isFormData };
}

function buildCustomFetchOptions({ url, method, body, header, isFormData }) {
  const options = { method, body, headers: header };
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };
  const finalOptions = { ...defaultOptions, ...options };

  if (
    ['POST', 'PUT', 'PATCH'].includes(finalOptions.method.toUpperCase()) &&
    finalOptions.body
  ) {
    if (!isJSONString(finalOptions.body)) {
      finalOptions.body = JSON.stringify(finalOptions.body);
    }
  }

  const formencodeType = 'application/x-www-form-urlencoded';
  if (
    (finalOptions.body && header['content-type']?.includes(formencodeType)) ||
    (header['Content-Type']?.includes(formencodeType) && isFormData)
  ) {
    let obj = isJSONString(finalOptions.body)
      ? JSON.parse(finalOptions.body)
      : finalOptions.body;
    finalOptions.body = encodeFormData(obj);
  }

  return { finalOptions, url };
}

async function executeCustomFetch2(finalOptions, url) {
  const response = await fetch(url, finalOptions);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const contentType = response.headers.get('Content-Type') || '';

  let data;
  if (contentType.includes('application/json') || contentType.includes('+json')) {
    data = await response.json();
  } else if (contentType.includes('text/')) {
    data = await response.text();
  } else if (contentType.includes('application/octet-stream')) {
    data = await response.blob();
  } else {
    data = await response.text();
  }
  return { data, contentType };
}

export async function customFetch2(params) {
  const { url, method, body, header, isFormData } =
    normalizeCustomFetchParams(params);
  const { finalOptions } = buildCustomFetchOptions({
    url,
    method,
    body,
    header,
    isFormData,
  });
  const { data } = await executeCustomFetch2(finalOptions, url);
  return data;
}

/**
 * Same request as customFetch2, but returns response Content-Type for routing validators.
 * @returns {{ data: unknown, contentType: string }}
 */
export async function customFetch2WithMeta(params) {
  const { url, method, body, header, isFormData } =
    normalizeCustomFetchParams(params);
  const { finalOptions } = buildCustomFetchOptions({
    url,
    method,
    body,
    header,
    isFormData,
  });
  return executeCustomFetch2(finalOptions, url);
}
