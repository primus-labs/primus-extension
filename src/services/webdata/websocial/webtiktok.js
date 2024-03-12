import WebSocial from './websocial';

class WebTikTok extends WebSocial {
  constructor() {
    super('tiktok');
  }

  async getInfo() {
    const params = {};
    params.url = "https://www.tiktok.com/api/user/detail/";
    params.method = 'GET';
    const storageStr = await chrome.storage.local.get([params.url]);
    const storageObj = JSON.parse(storageStr[params.url]);
    params.url = params.url + "?" + storageObj.queryString;
    params.headers = storageObj.headers;
    const res = await this.request(params);
    
    this.followers = res.userInfo.stats.followerCount;
    this.posts = res.userInfo.stats.videoCount;
    this.followings = res.userInfo.stats.followingCount;
    this.verified = res.userInfo.user.verified;
    this.userName = res.userInfo.user.nickname;
    this.userInfo.userName = res.userInfo.user.nickname;
  }

  async storeUserName() {
    /*const tiktokUserStr = await chrome.storage.local.get("tiktokUsername");
    if (tiktokUserStr["tiktokUsername"] ) {
        const tiktokUserObj = JSON.parse(tiktokUserStr["tiktokUsername"]);
        const now = new Date().getTime();
        if (now - tiktokUserObj.timestamp < 5000) {
          return;
        }
    }*/

    const params = {};
    params.url = "https://www.tiktok.com/passport/web/account/info/";
    params.method = 'GET';
    const storageStr = await chrome.storage.local.get([params.url]);
    const storageObj = JSON.parse(storageStr[params.url]);
    params.url = params.url + "?" + storageObj.queryString;
    params.headers = storageObj.headers;
    const res = await this.request(params);
    this.userName = res.data.username;
    /*const storeTiktokObj = {
      username: res.data.username,
      timestamp: new Date().getTime()
    }*/
    await chrome.storage.local.set({"tiktokUsername": res.data.username});
  }
}

export default WebTikTok;
