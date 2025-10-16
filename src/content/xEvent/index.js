let originName;
window.addEventListener('message', (e) => {
  const { target, origin, name, params } = e.data;
  if (target === 'primusExtension') {
    if (name === 'xEvent-follow') {
      originName = origin;
      chrome.runtime.sendMessage({
        type: 'xEvent',
        name: 'follow',
        params,
      });
    } else if (name === 'xEvent-repost') {
      chrome.runtime.sendMessage({
        type: 'xEvent',
        name: 'repost',
        params,
      });
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { type, name, params } = message;
  if (type === 'xEvent') {
    const xEventMap = {
      followRes: {
        eventName: 'xEvent-follow-res',
      },
      repostRes: {
        eventName: 'xEvent-repost-res',
      },
    };
    if (Object.keys(xEventMap).includes(name)) {
      window.postMessage({
        target: originName,
        origin: 'primusExtension',
        name: xEventMap[name].eventName,
        params,
      });
    }
    // if (name === 'followRes') {
    //   window.postMessage({
    //     target: originName,
    //     origin: 'primusExtension',
    //     name: 'xEvent-follow-res',
    //     params,
    //   });
    // }
  }
});
