class WebSocial {
    constructor(socialName) {
      this.socialName = socialName;
      this.followers = 0;
      this.posts = 0;
      this.followings = 0;
      this.verified = false;
      this.userName = '';
      this.userInfo = {};
    }

    async getInfo() {
    }
  
    async request(fetchParams) {
      let { method, url, data = {}, config, headers } = fetchParams;
  
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
      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = config?.timeout ?? 10 * 1000;
      const timeoutTimer = setTimeout(() => {
        controller.abort();
      }, timeout);
      let requestConfig = {
        method: method,
        headers: headers,
        cache: config?.cache ?? 'default', //  default | no-store | reload | no-cache | force-cache | only-if-cached 。
        signal: signal,
      };
  
      if (method === 'POST') {
        Object.defineProperty(requestConfig, 'body', {
          value: JSON.stringify(data),
        });
        requestConfig.headers['Content-Type'] = 'application/json'
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
    }
  }
  export default WebSocial;