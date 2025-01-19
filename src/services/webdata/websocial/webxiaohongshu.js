import WebSocial from './websocial';

class WebXiaohongshu extends WebSocial {
  constructor() {
    super('xiaohongshu');
    // Initialize userInfo with required properties
    this.userInfo = {
      userName: '',
      type: 'Social',
      platform: 'xiaohongshu',
      userId: '',
      profileUrl: '',
      exchangeInfo: {
        type: 'Social',
        platform: 'xiaohongshu',
        proofType: 'Account Ownership'
      }
    };
  }

  async getInfo() {
    const params = {};
    params.url = "https://edith.xiaohongshu.com/api/sns/web/v2/user/me";
    params.method = 'GET';
    
    const storageStr = await chrome.storage.local.get([params.url]);
    if (!storageStr[params.url]) {
      throw new Error('No stored request data found for Xiaohongshu');
    }

    const storageObj = JSON.parse(storageStr[params.url]);
    params.headers = storageObj.headers;

    try {
      const res = await this.request(params);
      
      if (!res?.data) {
        throw new Error('Invalid response from Xiaohongshu API');
      }

      // Update user info with response data
      const userId = res.data.red_id || res.data.userId;
      const userName = res.data.red_id || res.data.nickname;

      if (!userId || !userName) {
        throw new Error('Missing required user data from Xiaohongshu response');
      }

      // Set both instance userName and userInfo
      this.userName = userName;
      this.userInfo = {
        userName,
        userId,
        type: 'Social',
        platform: 'xiaohongshu',
        profileUrl: `https://www.xiaohongshu.com/user/profile/${userId}`,
        exchangeInfo: {
          type: 'Social',
          platform: 'xiaohongshu',
          proofType: 'Account Ownership'
        }
      };

      // Force a refresh of the component
      await chrome.storage.local.set({
        [`xiaohongshu_${userId}`]: this.userInfo
      });

      return this.userInfo;
    } catch (error) {
      console.error('Failed to get Xiaohongshu user info:', error);
      throw new Error('Failed to get Xiaohongshu user info: ' + error.message);
    }
  }
}

export default WebXiaohongshu;