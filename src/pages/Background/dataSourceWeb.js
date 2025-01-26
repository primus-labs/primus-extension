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
let completedDataTypes = new Set();

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
                  
                  // After clicking Followers tab, set up a timer to click Following tab
                  setTimeout(() => {
                    const followingSelectors = [
                      '//div[contains(text(), "Following")]',
                      '//span[contains(text(), "Following")]',
                      'div[data-e2e="following-tab"]'
                    ];
                    
                    for (const followingSelector of followingSelectors) {
                      let followingDiv;
                      if (followingSelector.startsWith('//')) {
                        followingDiv = document.evaluate(
                          followingSelector,
                          document,
                          null,
                          XPathResult.FIRST_ORDERED_NODE_TYPE,
                          null
                        ).singleNodeValue;
                      } else {
                        followingDiv = document.querySelector(followingSelector);
                      }
                      
                      if (followingDiv) {
                        console.log('Found following tab with selector:', followingSelector);
                        followingDiv.click();
                        break;
                      }
                    }
                  }, 2000); // Wait 2 seconds before clicking Following tab
                  
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
  console.log('Setting up follower data listeners with port:', port);
  activePort = port;
  
  let followersListener = null;
  let followingListener = null;

  // Create the listeners
  followersListener = async function(details) {
    if (completedDataTypes.has('followers')) {
      console.log('Followers data already complete, ignoring request');
      return;
    }
    
    if (details.url.includes('/api/user/list/') && details.url.includes('scene=67')) {
      console.log('Found followers list request:', details.url);
      try {
        const headers = {};
        details.requestHeaders.forEach(header => {
          headers[header.name.toLowerCase()] = header.value;
        });
        
        const headerData = {
          headers,
          timestamp: Date.now(),
          url: details.url
        };
        
        await Promise.all([
          chrome.storage.local.set({
            'tiktok-followers-headers': JSON.stringify(headerData)
          }),
          chrome.storage.local.set({
            [`tiktok-followers-headers-${tabId}`]: JSON.stringify(headerData)
          })
        ]);
      } catch (error) {
        console.error('Error storing followers headers:', error);
      }
    }
  };

  followingListener = async function(details) {
    if (completedDataTypes.has('following')) {
      console.log('Following data already complete, ignoring request');
      return;
    }
    
    if (details.url.includes('/api/user/list/') && details.url.includes('scene=21')) {
      console.log('Found following list request:', details.url);
      try {
        const headers = {};
        details.requestHeaders.forEach(header => {
          headers[header.name.toLowerCase()] = header.value;
        });
        
        const headerData = {
          headers,
          timestamp: Date.now(),
          url: details.url
        };
        
        await Promise.all([
          chrome.storage.local.set({
            'tiktok-following-headers': JSON.stringify(headerData)
          }),
          chrome.storage.local.set({
            [`tiktok-following-headers-${tabId}`]: JSON.stringify(headerData)
          })
        ]);
      } catch (error) {
        console.error('Error storing following headers:', error);
      }
    }
  };

  // Add the listeners
  chrome.webRequest.onSendHeaders.addListener(
    followersListener,
    { urls: ['https://www.tiktok.com/*'] },
    ['requestHeaders']
  );

  chrome.webRequest.onSendHeaders.addListener(
    followingListener,
    { urls: ['https://www.tiktok.com/*'] },
    ['requestHeaders']
  );

  // Response listener for both followers and following
  const responseListener = async function(details) {
    if (details.url.includes('/api/user/list/')) {
      const isFollowing = details.url.includes('scene=21');
      const listType = isFollowing ? 'following' : 'followers';
      
      // Skip if we've already completed this type
      if (completedDataTypes.has(listType)) {
        console.log(`${listType} data already complete, ignoring response`);
        return;
      }

      try {
        const storedData = await chrome.storage.local.get([
          isFollowing ? 'tiktok-following-headers' : 'tiktok-followers-headers',
          `${isFollowing ? 'tiktok-following-headers' : 'tiktok-followers-headers'}-${tabId}`
        ]);
        
        let headers = null;
        let headerData = null;
        
        const headerKey = isFollowing ? 'tiktok-following-headers' : 'tiktok-followers-headers';
        if (storedData[`${headerKey}-${tabId}`]) {
          headerData = JSON.parse(storedData[`${headerKey}-${tabId}`]);
          headers = headerData.headers;
        } else if (storedData[headerKey]) {
          headerData = JSON.parse(storedData[headerKey]);
          headers = headerData.headers;
        }

        if (headers) {
          const response = await fetch(details.url, { headers });
          const data = await response.json();
          
          if (data.userList && Array.isArray(data.userList)) {
            const users = data.userList.map(user => ({
              userId: user.user.id,
              uniqueId: user.user.uniqueId,
              nickname: user.user.nickname,
              avatar: user.user.avatarThumb,
              followerCount: user.stats.followerCount,
              followingCount: user.stats.followingCount,
              signature: user.user.signature
            }));

            const messageData = {
              type: isFollowing ? 'tiktok_following_data' : 'tiktok_followers_data',
              data: {
                users,
                hasMore: data.hasMore,
                total: data.total,
                cursor: data.minCursor,
                timestamp: Date.now()
              },
              url: details.url
            };

            // If hasMore is false, mark this type as complete
            if (!data.hasMore) {
              console.log(`${listType} data complete, removing listeners`);
              completedDataTypes.add(listType);
              
              // Remove the specific listener for this type
              if (isFollowing) {
                chrome.webRequest.onSendHeaders.removeListener(followingListener);
              } else {
                chrome.webRequest.onSendHeaders.removeListener(followersListener);
              }
              
              // If both types are complete, remove response listener
              if (completedDataTypes.size === 2) {
                console.log('All data complete, removing response listener');
                chrome.webRequest.onCompleted.removeListener(responseListener);
              }
            }

            // Try multiple ways to send the data
            let messageSent = false;

            if (activePort) {
              try {
                activePort.postMessage(messageData);
                console.log('Successfully sent via port');
                messageSent = true;
              } catch (error) {
                console.error('Error sending via port:', error);
                activePort = null;
              }
            }

            if (!messageSent) {
              try {
                await chrome.runtime.sendMessage(messageData);
                console.log('Successfully sent via runtime message');
                messageSent = true;
              } catch (error) {
                console.error('Error sending runtime message:', error);
              }
            }

            if (!messageSent) {
              try {
                await chrome.tabs.sendMessage(tabId, messageData);
                console.log('Successfully sent via tab message');
              } catch (error) {
                console.error('Error sending tab message:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing response:', error);
      }
    }
  };

  chrome.webRequest.onCompleted.addListener(
    responseListener,
    { urls: ['https://www.tiktok.com/*'] }
  );

  // Return cleanup function
  return () => {
    console.log('Cleaning up follower data listeners');
    chrome.webRequest.onSendHeaders.removeListener(followersListener);
    chrome.webRequest.onSendHeaders.removeListener(followingListener);
    chrome.webRequest.onCompleted.removeListener(responseListener);
    completedDataTypes.clear();
    activePort = null;
  };
}

// Handle fetching more followers and following
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fetch_more_followers' || message.type === 'fetch_more_following') {
    const { cursor } = message.data;
    const isFollowing = message.type === 'fetch_more_following';
    const headerKey = isFollowing ? 'tiktok-following-headers' : 'tiktok-followers-headers';
    const scene = isFollowing ? '21' : '67';
    
    chrome.storage.local.get(headerKey, async (result) => {
      if (result[headerKey]) {
        try {
          const headers = JSON.parse(result[headerKey]);
          // Construct the URL with the cursor and scene parameter
          const url = `https://www.tiktok.com/api/user/list/?scene=${scene}&cursor=${cursor}`;
          
          const response = await fetch(url, { headers });
          const data = await response.json();
          
          if (data.userList && Array.isArray(data.userList)) {
            const users = data.userList.map(user => ({
              userId: user.user.id,
              uniqueId: user.user.uniqueId,
              nickname: user.user.nickname,
              avatar: user.user.avatarThumb,
              followerCount: user.stats.followerCount,
              followingCount: user.stats.followingCount,
              signature: user.user.signature
            }));

            // Send new page of data
            chrome.runtime.sendMessage({
              type: isFollowing ? 'tiktok_following_data' : 'tiktok_followers_data',
              data: {
                users,
                hasMore: data.hasMore,
                total: data.total,
                cursor: data.minCursor
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching more ${isFollowing ? 'following' : 'followers'}:`, error);
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
        // Create a case-sensitive map of all headers
        const formatHeader = {};
        const headerMap = new Map();
        
        // Store headers with their original case
        requestHeaders.forEach(header => {
          formatHeader[header.name] = header.value;
          headerMap.set(header.name.toLowerCase(), {
            originalName: header.name,
            value: header.value
          });
        });

        // Store the request data with all necessary information
        const baseUrl = formatUrlKey.split('?')[0];
        const storageObj = await chrome.storage.local.get([baseUrl]);
        const currRequestUrlStorage = storageObj[baseUrl];
        const currRequestObj = currRequestUrlStorage
          ? JSON.parse(currRequestUrlStorage)
          : {};

        const newCurrRequestObj = {
          ...currRequestObj,
          headers: formatHeader,
          headerMap: Object.fromEntries(headerMap),
          originalHeaders: requestHeaders.map(h => ({ 
            name: h.name, 
            value: h.value,
            lowercaseName: h.name.toLowerCase()
          })),
          timestamp: Date.now()
        };

        if (addQueryStr) {
          newCurrRequestObj.queryString = addQueryStr;
        }

        console.log('Storing request data for:', baseUrl, newCurrRequestObj);
        await chrome.storage.local.set({
          [baseUrl]: JSON.stringify(newCurrRequestObj)
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
        const { headers: requestedHeaders, cookies, body, url } = r;
        const formatUrlKey = url;
        const requestInfoObj = await chrome.storage.local.get([formatUrlKey]);
        const {
          headers: storedHeaders,
          headerMap,
          originalHeaders,
          body: curRequestBody,
          queryString,
        } = (requestInfoObj[url] && JSON.parse(requestInfoObj[url])) || {};

        // Handle headers with case sensitivity
        let formattedHeaders = {};
        if (requestedHeaders && requestedHeaders.length > 0) {
          requestedHeaders.forEach((headerName) => {
            const headerLowerCase = headerName.toLowerCase();
            if (headerMap && headerMap[headerLowerCase]) {
              // Use the original header name and value from our stored map
              formattedHeaders[headerMap[headerLowerCase].originalName] = headerMap[headerLowerCase].value;
            } else if (storedHeaders) {
              // Fallback to case-insensitive search in stored headers
              const foundHeader = Object.entries(storedHeaders).find(
                ([key]) => key.toLowerCase() === headerLowerCase
              );
              if (foundHeader) {
                formattedHeaders[foundHeader[0]] = foundHeader[1];
              }
            }
          });
        } else {
          // If no specific headers requested, use all stored headers
          formattedHeaders = storedHeaders || {};
        }

        // Add headers to the request
        Object.assign(r, {
          headers: formattedHeaders,
          originalHeaders
        });

        // Handle cookies if specified
        if (cookies && cookies.length > 0 && storedHeaders?.Cookie) {
          const cookiesObj = parseCookie(storedHeaders.Cookie);
          const formateCookie = {};
          cookies.forEach((ck) => {
            formateCookie[ck] = cookiesObj[ck];
          });
          Object.assign(r, { cookies: formateCookie });
        }

        // Handle body if specified
        if (body && body.length > 0 && curRequestBody) {
          const formateBody = {};
          body.forEach((key) => {
            formateBody[key] = curRequestBody[key];
          });
          Object.assign(r, { body: formateBody });
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
      console.log('Formatted requests with headers:', formatRequests);
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

          // Store the complete request data
          const baseUrl = activeInfo.url.split('?')[0];
          const requestData = {
            headers: activeInfo.headers,
            cookies: activeInfo.cookies
          };

          // Only add originalHeaders and headerMap if originalHeaders exists
          if (activeInfo.originalHeaders && Array.isArray(activeInfo.originalHeaders)) {
            requestData.originalHeaders = activeInfo.originalHeaders;
            requestData.headerMap = Object.fromEntries(
              activeInfo.originalHeaders.map(h => [
                h.name.toLowerCase(),
                { originalName: h.name, value: h.value }
              ])
            );
          } else {
            // Create originalHeaders from regular headers if not present
            const headers = activeInfo.headers || {};
            requestData.originalHeaders = Object.entries(headers).map(([name, value]) => ({
              name,
              value,
              lowercaseName: name.toLowerCase()
            }));
            requestData.headerMap = Object.fromEntries(
              requestData.originalHeaders.map(h => [
                h.lowercaseName,
                { originalName: h.name, value: h.value }
              ])
            );
          }
          
          await chrome.storage.local.set({
            [baseUrl]: JSON.stringify(requestData)
          });

          // Store auth info with all headers
          const authInfoName = exchangeName + '-auth';
          await chrome.storage.local.set({
            [authInfoName]: JSON.stringify(activeInfo.headers),
          });

          const ex = new constructorF();
          await storeDataSource(exchangeName, ex, port);
          
          // After successful connection, navigate to profile page
          if (exchangeName === 'tiktok' && ex.userName) {
            console.log('Successfully connected TikTok, navigating to profile:', ex.userName);
            isNavigatingToProfile = false;
            await handleTikTokProfile(tabCreatedByPado, ex.userName, port);
          }
          
          if (port) {
            port.postMessage({
              resType: `set-${exchangeName}`,
              res: true
            });
          }
        }
      } catch (error) {
        console.error('Connection error:', error);
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
