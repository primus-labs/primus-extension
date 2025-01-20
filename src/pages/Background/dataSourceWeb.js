import { DATASOURCEMAP } from '@/config/dataSource';
import { storeDataSource } from './dataSourceUtils';

let tabCreatedByPado;
let activeTemplate = {};
let currExtentionId;
let isReadyRequest = false;
let operationType = null;
let isNavigatingToProfile = false;  // Add flag to track navigation state
let activePort = null;
let lastRequestTimestamp = 0;
const DEBOUNCE_INTERVAL = 1000; // 1 second

// Add new function to handle TikTok profile navigation
async function handleTikTokProfile(tab, username, port) {
  if (isNavigatingToProfile) {
    console.log('Already navigating to profile, skipping...');
    return;
  }

  console.log('Navigating to TikTok profile:', username);
  isNavigatingToProfile = true;
  
  let followersListener = null;

  try {
    // Navigate to profile (@gippptzyxxx i used for testing)
    await chrome.tabs.update(tab.id, {
      url: `https://www.tiktok.com/@${username}`
      // url: `https://www.tiktok.com/@gippptzyxxx`
    });

    // Wait for page load and click followers
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        console.log('Page loaded, injecting follower scripts');
        
        // Remove the listener
        chrome.tabs.onUpdated.removeListener(listener);

        // Remove any existing followers listener
        if (followersListener) {
          chrome.webRequest.onBeforeSendHeaders.removeListener(followersListener);
        }

        // Inject script to click followers div and auto-start
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            let hasClickedFollowers = false;
            let hasClickedTab = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 20;

            function clickFollowers() {
              if (hasClickedFollowers) return false;
              
              // Try multiple selector patterns
              const selectors = [
                'div.css-1ldzp5s-DivNumber.e1457k4r1',
                'strong[data-e2e="followers-count"]',
                'div[data-e2e="followers-count"]',
                'div.tiktok-1kd69nj-DivNumber'
              ];
              
              for (const selector of selectors) {
                const followersDiv = document.querySelector(selector);
                if (followersDiv) {
                  console.log('Found followers div with selector:', selector);
                  followersDiv.click();
                  hasClickedFollowers = true;
                  return true;
                }
              }
              
              console.log('Followers div not found yet... Attempt:', attempts);
              return false;
            }

            function clickFollowersTab() {
              if (!hasClickedFollowers || hasClickedTab) return false;
              
              // Try both XPath and regular selectors
              const tabSelectors = [
                '//div[contains(text(), "Followers")]',
                '//span[contains(text(), "Followers")]',
                'div[data-e2e="followers-tab"]'
              ];
              
              for (const selector of tabSelectors) {
                let tabDiv;
                if (selector.startsWith('//')) {
                  tabDiv = document.evaluate(
                    selector,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                  ).singleNodeValue;
                } else {
                  tabDiv = document.querySelector(selector);
                }
                
                if (tabDiv) {
                  console.log('Found followers tab with selector:', selector);
                  tabDiv.click();
                  hasClickedTab = true;
                  return true;
                }
              }
              
              console.log('Followers tab not found yet...');
              return false;
            }

            // Try clicking both elements in sequence
            const interval = setInterval(() => {
              attempts++;
              
              if (attempts >= MAX_ATTEMPTS) {
                console.log('Max attempts reached, clearing interval');
                clearInterval(interval);
                return;
              }
              
              if (!hasClickedFollowers) {
                clickFollowers();
              } else if (!hasClickedTab) {
                // Add a small delay after clicking followers before trying to click the tab
                setTimeout(() => {
                  if (clickFollowersTab()) {
                    clearInterval(interval);
                  }
                }, 500);
              }
            }, 1000);
          }
        });

        // Set up network listeners for follower data with port
        setupFollowerDataListeners(tab.id, port);
      }
    });
  } catch (error) {
    console.error('Error in handleTikTokProfile:', error);
    isNavigatingToProfile = false;
  }
}

// Helper function to set up network listeners
function setupFollowerDataListeners(tabId, port) {
  // Store the port for later use
  activePort = port;
  
  // Listen for the request headers without blocking
  chrome.webRequest.onSendHeaders.addListener(
    async function(details) {
      // Debounce the request
      const now = Date.now();
      if (now - lastRequestTimestamp < DEBOUNCE_INTERVAL) {
        return;
      }
      lastRequestTimestamp = now;

      if (details.url.includes('/api/user/list/') && details.url.includes('scene=67')) {
        console.log('Found followers list request:', details.url);
        try {
          const headers = {};
          details.requestHeaders.forEach(header => {
            headers[header.name.toLowerCase()] = header.value;
          });
          
          // Store headers with additional metadata
          const headerData = {
            headers,
            timestamp: now,
            url: details.url
          };
          
          await chrome.storage.local.set({
            'tiktok-followers-headers': JSON.stringify(headerData)
          });
          
          console.log('Stored followers request headers:', headerData);
        } catch (error) {
          console.error('Error storing followers request headers:', error);
        }
      }
    },
    { urls: ['https://www.tiktok.com/*'] },
    ['requestHeaders']
  );

  // Add response listener to capture the actual followers data
  chrome.webRequest.onCompleted.addListener(
    async function(details) {
      // Debounce the response handling
      const now = Date.now();
      if (now - lastRequestTimestamp < DEBOUNCE_INTERVAL) {
        return;
      }
      lastRequestTimestamp = now;

      if (details.url.includes('/api/user/list/') && details.url.includes('scene=67')) {
        console.log('Intercepted followers response:', details.url);
        try {
          // Get stored headers
          const storedData = await chrome.storage.local.get('tiktok-followers-headers');
          let headers = null;
          
          if (storedData['tiktok-followers-headers']) {
            const headerData = JSON.parse(storedData['tiktok-followers-headers']);
            headers = headerData.headers;
            
            // Check if headers are still valid (within 5 minutes)
            const isValid = now - headerData.timestamp < 5 * 60 * 1000;
            if (!isValid) {
              console.warn('Stored headers are too old, will try to refresh');
              return;
            }
          }

          if (headers) {
            console.log('Using stored headers for followers request:', headers);
            
            // Ensure critical headers are present
            const criticalHeaders = {
              'user-agent': headers['user-agent'] || navigator.userAgent,
              'cookie': headers['cookie'],
              'referer': headers['referer'] || 'https://www.tiktok.com/',
              'accept': 'application/json, text/plain, */*',
              'accept-language': 'en-US,en;q=0.9'
            };

            const response = await fetch(details.url, { 
              headers: criticalHeaders,
              credentials: 'include',
              mode: 'cors'
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Raw followers data:', data);

            if (data.userList && Array.isArray(data.userList)) {
              const followers = data.userList.map(user => ({
                userId: user.user.id,
                uniqueId: user.user.uniqueId,
                nickname: user.user.nickname,
                avatar: user.user.avatarThumb,
                followerCount: user.stats.followerCount,
                followingCount: user.stats.followingCount,
                signature: user.user.signature
              }));

              console.log('Processed followers:', followers);

              // Store the followers data
              const followersData = {
                followers,
                hasMore: data.hasMore,
                total: data.total,
                cursor: data.minCursor
              };

              await chrome.storage.local.set({
                'tiktok-followers-data': JSON.stringify(followersData)
              });

              // Send via port if available
              if (activePort) {
                console.log('Sending followers data via port');
                try {
                  activePort.postMessage({
                    type: 'tiktok_followers_data',
                    data: followersData
                  });
                } catch (error) {
                  console.error('Error sending message via port:', error);
                  // If port is dead, clear it
                  if (error.message.includes('disconnected')) {
                    activePort = null;
                  }
                }
              } else {
                console.warn('No active port available to send followers data');
                // Try to send via runtime message as fallback
                try {
                  chrome.runtime.sendMessage({
                    type: 'tiktok_followers_data',
                    data: followersData
                  });
                } catch (error) {
                  console.error('Error sending runtime message:', error);
                }
              }
            }
          } else {
            console.warn('No stored headers found for followers request');
          }
        } catch (error) {
          console.error('Error processing followers response:', error);
        }
      }
    },
    { urls: ['https://www.tiktok.com/*'] }
  );
}

// Handle fetching more followers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fetch_more_followers') {
    const { cursor } = message.data;
    chrome.storage.local.get('tiktok-followers-headers', async (result) => {
      if (result['tiktok-followers-headers']) {
        try {
          const headers = JSON.parse(result['tiktok-followers-headers']);
          // Construct the URL with the cursor and scene parameter
          const url = `https://www.tiktok.com/api/user/list/?scene=67&cursor=${cursor}`;
          
          const response = await fetch(url, { headers });
          const data = await response.json();
          
          if (data.userList && Array.isArray(data.userList)) {
            const followers = data.userList.map(user => ({
              userId: user.user.id,
              uniqueId: user.user.uniqueId,
              nickname: user.user.nickname,
              avatar: user.user.avatarThumb,
              followerCount: user.stats.followerCount,
              followingCount: user.stats.followingCount,
              signature: user.user.signature
            }));

            // Send new page of follower data
            chrome.runtime.sendMessage({
              type: 'tiktok_followers_data',
              data: {
                followers,
                hasMore: data.hasMore,
                total: data.total,
                cursor: data.minCursor
              }
            });
          }
        } catch (error) {
          console.error('Error fetching more followers:', error);
        }
      }
    });
    return true; // Keep the message channel open for async response
  }
});

// inject-dynamic
export const dataSourceWebMsgListener = async (
  request,
  sender,
  sendResponse,
  password,
  port
) => {
  const { name, params, operation } = request;

  // Handle TikTok profile navigation
  if (name === 'navigateToProfile') {
    if (tabCreatedByPado) {
      await handleTikTokProfile(tabCreatedByPado, params.username, port);
    }
    return;
  }

  if (name === 'init') {
    activeTemplate = params;
  }
  if (activeTemplate.dataSource) {
    let {
      dataSource,
      jumpTo,
      schemaType,
      datasourceTemplate: { host, requests, responses },
      uiTemplate,
      id,
      event,
    } = activeTemplate;
    const exchangeName = activeTemplate.dataSource;
    const exchangeInfo = DATASOURCEMAP[exchangeName];
    const { constructorF, type: sourceType } = exchangeInfo;
    //let isStoreTiktokName = false;

    const requestUrlList = requests.map((r) => r.url);
    const isUrlWithQueryFn = (url, queryKeyArr) => {
      const urlStrArr = url.split('?');
      const queryStr = urlStrArr[1];
      const queryStrArr = queryStr.split('&');
      const isUrlWithQuery = queryKeyArr.every((tQItem) => {
        return queryStrArr.some((qItem) => {
          return qItem.split('=')[0] === tQItem;
        });
      });
      return isUrlWithQuery ? queryStr : false;
    };
    const onBeforeSendHeadersFn = async (details) => {
      const { url: currRequestUrl, requestHeaders } = details;
      let formatUrlKey = currRequestUrl;
      let addQueryStr = '';
      const isTarget = requests.some((r) => {
        if (r.queryParams && r.queryParams[0]) {
          const urlStrArr = currRequestUrl.split('?');
          const hostUrl = urlStrArr[0];
          let curUrlWithQuery = r.url === hostUrl;
          if (r.url === hostUrl) {
            curUrlWithQuery = isUrlWithQueryFn(currRequestUrl, r.queryParams);
          }
          if (curUrlWithQuery) {
            addQueryStr = curUrlWithQuery;
          }
          formatUrlKey = hostUrl;
          return !!curUrlWithQuery;
        } else {
          return r.url === currRequestUrl;
        }
      });

      if (isTarget) {
        let formatHeader = requestHeaders.reduce((prev, curr) => {
          const { name, value } = curr;
          prev[name] = value;
          return prev;
        }, {});

        // Store the request data with the base URL as key
        const baseUrl = formatUrlKey.split('?')[0];
        const storageObj = await chrome.storage.local.get([baseUrl]);
        const currRequestUrlStorage = storageObj[baseUrl];
        const currRequestObj = currRequestUrlStorage
          ? JSON.parse(currRequestUrlStorage)
          : {};

        const newCurrRequestObj = {
          ...currRequestObj,
          headers: formatHeader,
        };

        if (addQueryStr) {
          newCurrRequestObj.queryString = addQueryStr;
        }

        console.log('Storing request data for:', baseUrl, newCurrRequestObj);
        await chrome.storage.local.set({
          [baseUrl]: JSON.stringify(newCurrRequestObj),
        });

        checkWebRequestIsReadyFn();

        /*if (
          dataSource === 'tiktok' &&
          !isStoreTiktokName &&
          formatUrlKey === 'https://www.tiktok.com/passport/web/account/info/'
        ) {
          isStoreTiktokName = true;
          console.log('store tiktok username and jump page');
          const tiktok = new constructorF();
          const tiktokUsernamePre = await chrome.storage.local.get(
            'tiktokUsername'
          );
          await tiktok.storeUserName();
          const tiktokUsername = await chrome.storage.local.get(
            'tiktokUsername'
          );
          const currentTab = await chrome.tabs.get(tabCreatedByPado.id);
          if (
            currentTab.url === jumpTo + '/' &&
            !tiktokUsernamePre['tiktokUsername']
          ) {
            chrome.tabs.update(tabCreatedByPado.id, {
              url: jumpTo + '/@' + tiktokUsername['tiktokUsername'],
            });
          }
        }*/
      }
    };
    const onBeforeRequestFn = async (subDetails) => {
      const { url: currRequestUrl, requestBody } = subDetails;
      let formatUrlKey = currRequestUrl;
      const isTarget = requests.some((r) => {
        if (r.queryParams && r.queryParams[0]) {
          const urlStrArr = currRequestUrl.split('?');
          const hostUrl = urlStrArr[0];
          let curUrlWithQuery = r.url === hostUrl;
          if (r.url === hostUrl) {
            curUrlWithQuery = isUrlWithQueryFn(currRequestUrl, r.queryParams);
          }
          formatUrlKey = hostUrl;
          return curUrlWithQuery;
        } else {
          return r.url === currRequestUrl;
        }
      });
      if (isTarget) {
        if (requestBody && requestBody.raw) {
          const rawBody = requestBody.raw[0];
          if (rawBody && rawBody.bytes) {
            const byteArray = new Uint8Array(rawBody.bytes);
            const bodyText = new TextDecoder().decode(byteArray);
            console.log(
              `url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
            );

            const storageObj = await chrome.storage.local.get([formatUrlKey]);
            const currRequestUrlStorage = storageObj[formatUrlKey];
            const currRequestObj = currRequestUrlStorage
              ? JSON.parse(currRequestUrlStorage)
              : {};
            const newCurrRequestObj = {
              ...currRequestObj,
              body: JSON.parse(bodyText),
            };
            await chrome.storage.local.set({
              [formatUrlKey]: JSON.stringify(newCurrRequestObj),
            });
          }
        }
      }
    };
    const checkWebRequestIsReadyFn = async () => {
      const checkReadyStatusFn = async () => {
        const interceptorRequests = requests.filter((r) => r.name !== 'first');
        const interceptorUrlArr = interceptorRequests.map((i) => i.url);
        const storageObj = await chrome.storage.local.get(interceptorUrlArr);
        const storageArr = Object.values(storageObj);
        if (storageArr.length === interceptorUrlArr.length) {
          const f = interceptorRequests.every((r) => {
            // const storageR = Object.keys(storageObj).find(
            //   (sRKey) => sRKey === r.url
            // );
            const sRrequestObj = storageObj[r.url]
              ? JSON.parse(storageObj[r.url])
              : {};
            const headersFlag =
              !r.headers || (!!r.headers && !!sRrequestObj.headers);
            const bodyFlag = !r.body || (!!r.body && !!sRrequestObj.body);
            const cookieFlag =
              !r.cookies ||
              (!!r.cookies &&
                !!sRrequestObj.headers &&
                !!sRrequestObj.headers.Cookie);
            return headersFlag && bodyFlag && cookieFlag;
          });
          return f;
        } else {
          return false;
        }
      };
      isReadyRequest = await checkReadyStatusFn();
      if (isReadyRequest) {
        console.log('web requests are captured');
        chrome.tabs.sendMessage(tabCreatedByPado.id, {
          type: 'dataSourceWeb',
          name: 'webRequestIsReady',
          params: {
            isReady: isReadyRequest,
          },
        });
      }
    };
    const formatRequestsFn = async () => {
      const formatRequests = [];
      for (const r of JSON.parse(JSON.stringify(requests))) {
        const { headers, cookies, body, url } = r;
        const formatUrlKey = url;
        const requestInfoObj = await chrome.storage.local.get([formatUrlKey]);
        const {
          headers: curRequestHeader,
          body: curRequestBody,
          queryString,
        } = (requestInfoObj[url] && JSON.parse(requestInfoObj[url])) || {};

        const cookiesObj = curRequestHeader
          ? parseCookie(curRequestHeader.Cookie)
          : {};
        let formateHeader = {},
          formateCookie = {},
          formateBody = {};
        if (headers && headers.length > 0) {
          headers.forEach((hk) => {
            if (curRequestHeader) {
              const inDataSourceHeaderKey = Object.keys(curRequestHeader).find(
                (h) => h.toLowerCase() === hk.toLowerCase()
              );
              formateHeader[hk] = curRequestHeader[inDataSourceHeaderKey];
            }
          });
          Object.assign(r, {
            headers: formateHeader,
          });
        }
        if (cookies && cookies.length > 0) {
          cookies.forEach((ck) => {
            formateCookie[ck] = cookiesObj[ck];
          });
          Object.assign(r, {
            cookies: formateCookie,
          });
        }
        if (body && body.length > 0) {
          body.forEach((hk) => {
            formateBody[hk] = curRequestBody[hk];
          });
          Object.assign(r, {
            body: formateBody,
          });
        }
        if (queryString) {
          Object.assign(r, {
            url: r.url + '?' + queryString,
          });
        }
        if ('queryParams' in r) {
          delete r.queryParams;
        }

        formatRequests.push(r);
      }
      console.log('222formatRequests', formatRequests);
      return formatRequests;
    };

    if (name === 'init') {
      operationType = operation;
      // const { extensionTabId } = request;
      // currExtentionId = extensionTabId;
      const currentWindowTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      currExtentionId = currentWindowTabs[0].id;
      chrome.webRequest.onBeforeSendHeaders.addListener(
        onBeforeSendHeadersFn,
        { urls: ['<all_urls>'] },
        ['requestHeaders', 'extraHeaders']
      );
      chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequestFn,
        { urls: ['<all_urls>'] },
        ['requestBody']
      );

      /*const tiktokUsername = await chrome.storage.local.get('tiktokUsername');
      if (dataSource === 'tiktok' && tiktokUsername['tiktokUsername']) {
        jumpTo = jumpTo + '/@' + tiktokUsername['tiktokUsername'];
      }*/
      tabCreatedByPado = await chrome.tabs.create({
        url: jumpTo,
      });
      console.log('222pageWeb tabCreatedByPado', tabCreatedByPado);
      const injectFn = async () => {
        await chrome.scripting.executeScript({
          target: {
            tabId: tabCreatedByPado.id,
          },
          files: ['dataSourceWeb.bundle.js'],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tabCreatedByPado.id },
          files: ['static/css/dataSourceWeb.css'],
        });
      };
      await injectFn();
      checkWebRequestIsReadyFn();
      chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (
          tabId === tabCreatedByPado.id &&
          (changeInfo.url || changeInfo.title)
        ) {
          await injectFn();
          checkWebRequestIsReadyFn();
        }
      });

      chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
        if (tabId === tabCreatedByPado.id) {
          chrome.runtime.sendMessage({
            type: 'dataSourceWeb',
            name: 'stop',
          });
        }
      });
      // injectFn();
    }
    if (name === 'initCompleted') {
      console.log('content_scripts-bg-web receive:initCompleted');
      sendResponse({
        name: 'append',
        params: {
          ...activeTemplate,
        },
        dataSourcePageTabId: tabCreatedByPado.id,
        isReady: isReadyRequest,
        operation: operationType,
      });
    }
    if (name === 'start') {
      if (operation) {
        operationType = operation;
      }
      try {
        const formatRequests = await formatRequestsFn();
        console.log('Formatted requests:', formatRequests);
        
        if (operationType === 'connect') {
          const activeInfo = formatRequests.find((i) => i.headers);
          if (!activeInfo) {
            throw new Error('No valid request headers found');
          }

          // Store the request data before creating the constructor
          const baseUrl = activeInfo.url.split('?')[0];
          const requestData = {
            headers: activeInfo.headers,
            cookies: activeInfo.cookies
          };
          
          await chrome.storage.local.set({
            [baseUrl]: JSON.stringify(requestData)
          });

          const activeHeader = Object.assign({}, activeInfo.headers);
          const authInfoName = exchangeName + '-auth';
          
          await chrome.storage.local.set({
            [authInfoName]: JSON.stringify(activeHeader),
          });

          const ex = new constructorF();
          await storeDataSource(exchangeName, ex, port);
          
          // After successful connection, navigate to profile page
          if (exchangeName === 'tiktok' && ex.userName) {
            console.log('Successfully connected TikTok, navigating to profile:', ex.userName);
            // Reset navigation flag since we're starting a new navigation
            isNavigatingToProfile = false;
            await handleTikTokProfile(tabCreatedByPado, ex.userName, port);
          }
          
          // Send success message back to content script
          if (port) {
            port.postMessage({
              resType: `set-${exchangeName}`,
              res: true
            });
          }
        }
      } catch (error) {
        console.error('Connection error:', error);
        // Send error message back to content script
        if (port) {
          port.postMessage({
            resType: `set-${exchangeName}`,
            res: false,
            error: error.message
          });
        }
      }
    }
   
    if (name === 'close' || name === 'cancel' || name === 'cancelByPado') {
      await chrome.tabs.update(currExtentionId, {
        active: true,
      });
      await chrome.tabs.remove(tabCreatedByPado.id);
      activeTemplate = {};
    }
    if (name === 'end') {
      if (tabCreatedByPado) {
        chrome.tabs.sendMessage(
          tabCreatedByPado.id,
          request,
          function (response) {}
        );
        chrome.webRequest.onBeforeSendHeaders.removeListener(
          onBeforeSendHeadersFn
        );
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
      }
    }
  } else {
    if (name === 'end') {
      if (tabCreatedByPado) {
        chrome.tabs.sendMessage(
          tabCreatedByPado.id,
          request,
          function (response) {}
        );
        activeTemplate = {};
      }
    }
  }
};

const parseCookie = (str) => {
  str = str || '';
  return str
    .split(';')
    .map((v) => v.split('='))
    .reduce((acc, v) => {
      if (v[0] && v[1]) {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      }

      return acc;
    }, {});
};
