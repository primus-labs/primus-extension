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

  try {
    const response = await fetch(url, finalOptions);
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
  } catch (error) {
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
