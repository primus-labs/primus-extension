import { isJSONString, encodeFormData } from './utils';
export default async function customFetch(url, options = {}) {
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

  try {
    const response = await fetch(url, finalOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function customFetch2({ url, method, body, header, isFormData }) {
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

  // Try with cookies first (session-scoped endpoints need them). Public
  // endpoints that reply Access-Control-Allow-Origin: * (e.g. Lighter) reject a
  // credentialed cross-origin fetch in the browser, so retry without
  // credentials on failure. This is the fetch that validates the target
  // response for readiness (extraRequestFn2), so it MUST succeed for such
  // endpoints or isTarget never becomes 1 and the attestation times out (00013).
  const attempt = async (credentials) => {
    const response = await fetch(url, { ...finalOptions, credentials });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      return await response.json();
    } else if (contentType.includes('text/')) {
      return await response.text();
    } else if (contentType.includes('application/octet-stream')) {
      return await response.blob();
    } else {
      return await response.text();
    }
  };
  try {
    return await attempt(finalOptions.credentials);
  } catch (error) {
    if (finalOptions.credentials !== 'omit') {
      try {
        return await attempt('omit');
      } catch (fallbackError) {
        console.error('Fetch error:', url, fallbackError);
        throw fallbackError;
      }
    }
    console.error('Fetch error:', url, error);
    throw error;
  }
}
// customFetch('https://api.example.com/data')
//   .then((data) => console.log('GET response:', data))
//   .catch((error) => console.error('GET error:', error));

// customFetch('https://api.example.com/data', {
//   method: 'POST',
//   body: { key1: 'value1', key2: 'value2' },
// })
//   .then((data) => console.log('POST response:', data))
//   .catch((error) => console.error('POST error:', error));
