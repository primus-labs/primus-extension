let callerTabId;
let createdTabIdByExtension;
let taskDoneFlag = false;

const xEventMap = {
  follow: {
    url: `https://x.com/intent/follow`,
    queryKey: 'screen_name',
    eventName: 'followRes',
  },
  repost: {
    url: `https://x.com/intent/retweet`,
    queryKey: 'tweet_id',
    eventName: 'repostRes',
  },
};

export const listener = async (request, sender) => {
  const { type, name, params } = request;
  if (type === 'xEvent') {
    if (Object.keys(xEventMap).includes(name)) {
      callerTabId = sender.tab.id;
      const queryK = xEventMap[name].queryKey;
      const url = `${xEventMap[name].url}?${queryK}=${params[queryK]}`;
      taskDoneFlag = false;
      const tabCreatedByPado = await chrome.tabs.create({
        url,
      });
      createdTabIdByExtension = tabCreatedByPado.id;
      chrome.tabs.onRemoved.addListener((tabId) => {
        if (tabId === createdTabIdByExtension) {
          if (!taskDoneFlag) {
            chrome.tabs.sendMessage(callerTabId, {
              type: 'xEvent',
              name: xEventMap[name].eventName,
              params: {
                result: false,
              },
            });
          }
        }
      });
    }
  }
  if (type === 'xPage') {
    if (Object.keys(xEventMap).includes(name)) {
      if (createdTabIdByExtension) {
        taskDoneFlag = true;
        await chrome.tabs.remove(createdTabIdByExtension);
        chrome.tabs.sendMessage(callerTabId, {
          type: 'xEvent',
          name: xEventMap[name].eventName,
          params,
        });
        await chrome.tabs.update(callerTabId, {
          active: true,
        });
      }
    }
  }
};
