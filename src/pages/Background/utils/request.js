import { isJSONString } from './utils';
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
    if (isJSONString(finalOptions.body)) {
      finalOptions.body = finalOptions.body;
    } else {
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

export async function customFetch2({ url, method, body, header }) {
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
    if (isJSONString(finalOptions.body)) {
      finalOptions.body = finalOptions.body;
    } else {
      finalOptions.body = JSON.stringify(finalOptions.body);
    }
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
    console.error('Fetch error:', error);
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
