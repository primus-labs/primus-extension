import WebSocial from './websocial';

class WebTikTok extends WebSocial {
  constructor() {
    super('tiktok');
    // Initialize userInfo with required properties
    this.userInfo = {
      userName: '',
      type: 'Social',
      platform: 'tiktok',
      userId: '',
      profileUrl: '',
      exchangeInfo: {
        type: 'Social',
        platform: 'tiktok',
        proofType: 'Account Ownership'
      }
    };
  }

  async getInfo() {
    const baseUrl = "https://www.tiktok.com/passport/web/account/info/";
    const params = {
      url: baseUrl,
      method: 'GET'
    };
    
    const storageStr = await chrome.storage.local.get([baseUrl]);
    if (!storageStr[baseUrl]) {
      throw new Error('No stored request data found for TikTok');
    }

    const storageObj = JSON.parse(storageStr[baseUrl]);
    
    // Add headers from storage
    params.headers = storageObj.headers;

    // Add query string if it exists
    if (storageObj.queryString) {
      params.url = `${baseUrl}?${storageObj.queryString}`;
    }

    try {
      console.log('Making TikTok API request with params:', params);
      const res = await this.request(params);
      
      if (!res?.data) {
        throw new Error('Invalid response from TikTok API');
      }

      // Update user info with response data
      const userId = res.data.user_id_str || res.data.user_id;
      const userName = res.data.username;

      if (!userId || !userName) {
        throw new Error('Missing required user data from TikTok response');
      }

      // Set both instance userName and userInfo
      this.userName = userName;
      this.userInfo = {
        userName,
        userId,
        type: 'Social',
        platform: 'tiktok',
        profileUrl: `https://www.tiktok.com/@${userName}`,
        exchangeInfo: {
          type: 'Social',
          platform: 'tiktok',
          proofType: 'Account Ownership'
        }
      };

      // Store user info in local storage
      await chrome.storage.local.set({
        [`tiktok_${userId}`]: this.userInfo
      });

      return this.userInfo;
    } catch (error) {
      console.error('Failed to get TikTok user info:', error);
      throw new Error('Failed to get TikTok user info: ' + error.message);
    }
  }
}

export default WebTikTok;
