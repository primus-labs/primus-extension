import WebSocial from './websocial';

class WebDocusign extends WebSocial {
  constructor() {
    super('docusign');
  }

  async getInfo() {
    const params = {};
    params.url = "https://apps.docusign.com/api/send/__settings?IS_ONE_DS_MODE=true";
    params.method = 'GET';
    const storageStr = await chrome.storage.local.get([params.url]);
    const storageObj = JSON.parse(storageStr[params.url]);
    params.headers = storageObj.headers;
    const res = await this.request(params);
    this.userName = res.session.userName;
    this.userInfo.userName = res.session.userName;
    this.userInfo.userName = res.session.userId;
    this.userInfo.accountIdGuid = res.session.accountIdGuid;

    await chrome.storage.local.set({"docusignUserId": res.session.userId});
    await chrome.storage.local.set({"docusignAccountId": res.session.accountIdGuid});
  }

  async storeUserName() {
    const params = {};
    params.url = "https://apps.docusign.com/api/send/__settings?IS_ONE_DS_MODE=true";
    params.method = 'GET';
    const storageStr = await chrome.storage.local.get([params.url]);
    const storageObj = JSON.parse(storageStr[params.url]);
    params.headers = storageObj.headers;
    const res = await this.request(params);
    this.userName = res.session.userName;
    this.userInfo.userName = res.session.userName;
    this.userInfo.userId = res.session.userId;
    this.userInfo.accountIdGuid = res.session.accountIdGuid;
    await chrome.storage.local.set({"docusignUserId": res.session.userId});
    await chrome.storage.local.set({"docusignAccountId": res.session.accountIdGuid});
  }
}

export default WebDocusign;
