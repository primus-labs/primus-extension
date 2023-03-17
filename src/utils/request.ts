type FetchParams = {
  method: string
  url: string;
  data?: any;
  config?: any;
}

const request = async(fetchParams: FetchParams) => {
  let {method, url, data= {}, config} = fetchParams
  const baseUrl = "http://18.179.8.186:8080"
  method = method.toUpperCase();
  url = baseUrl + url;

  if (method === 'GET') {
      let dataStr = '';
      Object.keys(data).forEach(key => {
          dataStr += key + '=' + data[key] + '&';
      })
      if (dataStr !== '') {
          dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'));
          url = url + '?' + dataStr;
      }
  }
  let requestConfig: any = {
      credentials: 'same-origin',
      method: method,
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...config?.extraHeader
      },
      mode: "cors", //  same-origin | no-cors（default）|cores;
      cache: config?.cache ?? "default" //  default | no-store | reload | no-cache | force-cache | only-if-cached 。
  }

  if (method === 'POST') {
      Object.defineProperty(requestConfig, 'body', {
          value: JSON.stringify(data)
      })
  }
  try {
      const response = await fetch(url, requestConfig);
      const responseJson = await response.json();
      return responseJson
  } catch (error:any) {
      throw new Error(error)
  }
}
export default request