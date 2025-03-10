import WebSocial from './websocial';

export class WebXiaohongshu extends WebSocial {
  constructor() {
    super('xiaohongshu');
    this.baseUrl = 'https://edith.xiaohongshu.com';
    this.socialName = 'xiaohongshu';
    this.userName = '';
    this.userInfo = {
      userName: '',
      userId: '',
      type: 'Social',
      platform: 'xiaohongshu',
      exchangeInfo: {
        type: 'Social',
        platform: 'xiaohongshu',
        proofType: 'Account Ownership'
      }
    };
  }

  async getInfo() {
    try {
      // Compare with TikTok data structure
      const [tiktokData, socialSourcesData] = await Promise.all([
        chrome.storage.local.get(['tiktok']),
        chrome.storage.local.get(['socialSources'])
      ]);
      
      // Safely parse JSON values or handle objects directly
      let parsedTiktokData = null;
      if (tiktokData.tiktok) {
        try {
          parsedTiktokData = typeof tiktokData.tiktok === 'string' 
            ? JSON.parse(tiktokData.tiktok) 
            : tiktokData.tiktok;
        } catch (e) {
          console.log('Error parsing TikTok data:', e);
        }
      }
      
      let parsedSocialSources = null;
      if (socialSourcesData.socialSources) {
        try {
          parsedSocialSources = typeof socialSourcesData.socialSources === 'string' 
            ? JSON.parse(socialSourcesData.socialSources) 
            : socialSourcesData.socialSources;
        } catch (e) {
          console.log('Error parsing socialSources:', e);
        }
      }
      
      console.log('TikTok stored data:', parsedTiktokData);
      console.log('Social Sources data:', parsedSocialSources);

      // Get stored headers from both locations
      const [urlData, authData] = await Promise.all([
        chrome.storage.local.get(['https://edith.xiaohongshu.com/api/sns/web/v2/user/me']),
        chrome.storage.local.get(['xiaohongshu-auth'])
      ]);

      console.log('URL Data:', urlData);
      console.log('Auth Data:', authData);

      const params = {
        url: `${this.baseUrl}/api/sns/web/v2/user/me`,
        method: 'GET',
        headers: {},
        credentials: 'include'
      };

      // Try to parse the URL data first
      if (urlData['https://edith.xiaohongshu.com/api/sns/web/v2/user/me']) {
        let storedData;
        try {
          storedData = typeof urlData['https://edith.xiaohongshu.com/api/sns/web/v2/user/me'] === 'string'
            ? JSON.parse(urlData['https://edith.xiaohongshu.com/api/sns/web/v2/user/me'])
            : urlData['https://edith.xiaohongshu.com/api/sns/web/v2/user/me'];
          
          console.log('Stored URL data:', storedData);
          
          if (storedData.originalHeaders && Array.isArray(storedData.originalHeaders)) {
            storedData.originalHeaders.forEach(header => {
              params.headers[header.name] = header.value;
            });
          } else if (storedData.headers) {
            params.headers = { ...params.headers, ...storedData.headers };
          }
        } catch (e) {
          console.error('Error parsing URL data:', e);
        }
      }

      // If we don't have all necessary headers, try to use auth data
      if (!params.headers['X-s'] || !params.headers['X-t']) {
        if (authData['xiaohongshu-auth']) {
          try {
            const authHeaders = typeof authData['xiaohongshu-auth'] === 'string'
              ? JSON.parse(authData['xiaohongshu-auth'])
              : authData['xiaohongshu-auth'];
              
            params.headers = { ...params.headers, ...authHeaders };
          } catch (e) {
            console.error('Error parsing auth data:', e);
          }
        }
      }

      // Ensure we have required headers
      const requiredHeaders = ['X-s', 'X-t', 'Cookie', 'Origin', 'Referer', 'X-S-Common'];
      const missingHeaders = requiredHeaders.filter(header => !params.headers[header] && !params.headers[header.toLowerCase()]);

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Make the request using the parent class method
      console.log('Making Xiaohongshu API request with params:', params);
      const res = await this.request(params);
      
      if (!res?.data) {
        throw new Error('Invalid response from Xiaohongshu API');
      }

      // Set the class properties first
      const redId = res.data.red_id;
      const userId = res.data.user_id;

      if (!redId || !userId) {
        throw new Error('Missing required user data from Xiaohongshu response');
      }

      // Set both instance userName and userInfo
      this.userName = redId;
      this.userInfo = {
        userName: redId,
        userId: userId,
        type: 'Social',
        platform: 'xiaohongshu',
        profileUrl: `https://www.xiaohongshu.com/user/profile/${userId}`,
        exchangeInfo: {
          type: 'Social',
          platform: 'xiaohongshu',
          proofType: 'Account Ownership'
        }
      };

      // Store the data in chrome.storage.local with exact same structure as TikTok
      const storageData = {
        socialName: this.socialName,
        userName: redId,
        userInfo: this.userInfo,
        version: '1.0.1',
        date: new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric'
        }),
        timestamp: Date.now()
      };

      console.log('About to store Xiaohongshu data:', storageData);

      // Store in multiple locations like TikTok
      await Promise.all([
        // Store in xiaohongshu key
        chrome.storage.local.set({
          xiaohongshu: JSON.stringify(storageData)
        }),
        // Store in user-specific key like TikTok
        chrome.storage.local.set({
          [`xiaohongshu_${userId}`]: this.userInfo
        }),
        // Store in socialSources
        chrome.storage.local.get(['socialSources']).then(result => {
          let socialSources = {};
          
          // Carefully handle socialSources which might be a string or an object
          if (result.socialSources) {
            try {
              socialSources = typeof result.socialSources === 'string'
                ? JSON.parse(result.socialSources)
                : result.socialSources;
            } catch (e) {
              console.error('Error parsing socialSources in storage operation:', e);
              // If parsing fails, start with empty object
              socialSources = {};
            }
          }
          
          // Update xiaohongshu data
          socialSources.xiaohongshu = storageData;
          
          // Store as object, not string - this is a key fix
          return chrome.storage.local.set({ socialSources });
        })
      ]);

      // Verify the data was stored correctly
      const [verifyXiaohongshu, verifyUserSpecific, verifySocialSources] = await Promise.all([
        chrome.storage.local.get(['xiaohongshu']),
        chrome.storage.local.get([`xiaohongshu_${userId}`]),
        chrome.storage.local.get(['socialSources'])
      ]);
      
      // Safely parse strings or handle objects directly
      let parsedXiaohongshu = null;
      if (verifyXiaohongshu.xiaohongshu) {
        try {
          parsedXiaohongshu = typeof verifyXiaohongshu.xiaohongshu === 'string'
            ? JSON.parse(verifyXiaohongshu.xiaohongshu)
            : verifyXiaohongshu.xiaohongshu;
        } catch (e) {
          console.error('Error parsing verification data for xiaohongshu:', e);
        }
      }
      
      let verifiedSocialSources = null;
      if (verifySocialSources.socialSources) {
        try {
          verifiedSocialSources = typeof verifySocialSources.socialSources === 'string'
            ? JSON.parse(verifySocialSources.socialSources)
            : verifySocialSources.socialSources;
        } catch (e) {
          console.error('Error parsing verification data for socialSources:', e);
        }
      }
      
      console.log('Verified Xiaohongshu storage:', parsedXiaohongshu);
      console.log('Verified User-specific storage:', verifyUserSpecific[`xiaohongshu_${userId}`]);
      console.log('Verified Social Sources:', verifiedSocialSources);

      return this.userInfo;
    } catch (error) {
      console.error('Failed to get Xiaohongshu user info:', error);
      throw new Error('Failed to get Xiaohongshu user info: ' + error.message);
    }
  }

  async getFollowers() {
    // Implement followers fetching if needed
    throw new Error('Not implemented');
  }

  async getFollowing() {
    // Implement following fetching if needed
    throw new Error('Not implemented');
  }
}

export default WebXiaohongshu;