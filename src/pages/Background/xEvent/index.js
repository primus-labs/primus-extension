let callerTabId;
let createdTabIdByExtension;

export const listener = async (request, sender) => {
  const { type, name, params } = request;
  // handler request from content script
  if (type === 'xEvent') {
    if (name === 'follow') {
      callerTabId = null;
      callerTabId = sender.tab.id;
      const url = `https://x.com/intent/follow?screen_name=${params.screen_name}`;
      const tabCreatedByPado = await chrome.tabs.create({
        url,
      });
      createdTabIdByExtension = tabCreatedByPado.id;
    } else if (name === 'repost') {
      callerTabId = null;
      callerTabId = sender.tab.id;
      const url = `https://x.com/intent/retweet?tweet_id=${params.tweet_id}`;
      const tabCreatedByPado = await chrome.tabs.create({
        url,
      });
      createdTabIdByExtension = tabCreatedByPado.id;
    }
  }
  // handle x‘s response
  if (type === 'xPage') {
    const xEventMap = {
      follow: {
        eventName: 'followRes',
      },
      repost: {
        eventName: 'repostRes',
      },
    };
    if (Object.keys(xEventMap).includes(name)) {
      if (createdTabIdByExtension) {
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
    // else if (name === 'repost') {
    //   if (createdTabIdByExtension) {
    //     await chrome.tabs.remove(createdTabIdByExtension);
    //     chrome.tabs.sendMessage(callerTabId, {
    //       type: 'xEvent',
    //       name: 'repostRes',
    //       params,
    //     });
    //     await chrome.tabs.update(callerTabId, {
    //       active: true,
    //     });
    //   }
    // }
  }
};
