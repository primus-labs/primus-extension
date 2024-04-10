import WebSocial from './websocial';

class WebTikTok extends WebSocial {
  constructor() {
    super('tiktok');
  }

  async getInfo() {
    const params = {};
    params.url = "https://www.tiktok.com/passport/web/account/info/";
    params.method = 'GET';
    const storageStr = await chrome.storage.local.get([params.url]);
    const storageObj = JSON.parse(storageStr[params.url]);
    params.url = params.url + "?" + storageObj.queryString;
    params.headers = storageObj.headers;
    const res = await this.request(params);

    this.userName = res.data.username;
    this.userInfo.userName = res.data.username;
    this.createdTime = (res.data.create_time ?? res.data.connects[0]?.create_time) * 1000;
  }

}

export default WebTikTok;
