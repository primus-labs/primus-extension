type FetchParams = {
  method: string
  url: string;
  data?: any;
}
const request = async(fetchParams: FetchParams) => {
  let {method, url, data= {}} = fetchParams
  const baseUrl = "http://18.179.8.186:8080" // 基础路径
  method = method.toUpperCase(); // 请求方式小写转换成大写
  url = baseUrl + url; // 请求地址的拼接

  if (method == 'GET') {
      let dataStr = ''; //数据拼接字符串
      Object.keys(data).forEach(key => {
          dataStr += key + '=' + data[key] + '&';
      })
      if (dataStr !== '') {
          dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'));
          url = url + '?' + dataStr;
      }
  }
  let requestConfig = {
      credentials: 'same-origin',
      method: method,
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      mode: "cors", // 用来决定是否允许跨域请求  值有 三个 same-origin，no-cors（默认）以及 cores;
      cache: "force-cache" // 是否缓存请求资源 可选值有 default 、 no-store 、 reload 、 no-cache 、 force-cache 或者 only-if-cached 。
  }

  if (method == 'POST') {
      Object.defineProperty(requestConfig, 'body', {
          value: JSON.stringify(data)
      })
  }
  try {
      const response = await fetch(url, requestConfig);
      const responseJson = await response.json();
      return responseJson
  } catch (error) {
      throw new Error(error)
  }
}
export default request