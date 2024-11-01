export default async function customFetch(url, options = {}) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  
  const finalOptions = { ...defaultOptions, ...options };

  
  if (finalOptions.method === 'POST' && finalOptions.body) {
    finalOptions.headers['Content-Type'] = 'application/json';
    finalOptions.body = JSON.stringify(finalOptions.body);
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

// customFetch('https://api.example.com/data')
//   .then((data) => console.log('GET response:', data))
//   .catch((error) => console.error('GET error:', error));


// customFetch('https://api.example.com/data', {
//   method: 'POST',
//   body: { key1: 'value1', key2: 'value2' },
// })
//   .then((data) => console.log('POST response:', data))
//   .catch((error) => console.error('POST error:', error));
