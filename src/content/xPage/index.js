const xEventMap = {
  '/intent/retweet': {
    searchParamKey: 'tweet_id',
    eventName: 'repost',
  },
  '/intent/follow': {
    searchParamKey: 'screen_name',
    eventName: 'follow',
  },
};
let type = 'xPage';
let checkTimer = null;

checkTimer = setInterval(() => {
  var element = document.querySelector(
    "[data-testid='confirmationSheetConfirm']"
  );
  var cancelElement = document.querySelector(
    "[data-testid='confirmationSheetCancel']"
  );
  console.log(
    'primus injected xPage checkTimer follow btn',
    element,
    cancelElement
  );
  if (element && cancelElement) {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const pathname = url.pathname;
    const searchParams = url.searchParams;
    if (Object.keys(xEventMap).includes(pathname)) {
      const { searchParamKey, eventName } = xEventMap[pathname];
      const specificParamValue = searchParams.get(searchParamKey);
      element.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          type,
          name: eventName,
          params: {
            [searchParamKey]: specificParamValue,
            result: true,
          },
        });
        //   {
        //   type: 'xPage',
        //   name: 'follow',
        //   params: {
        //     screen_name: specificParamValue,
        //   },
        // }
      });
      cancelElement.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          type,
          name: eventName,
          params: {
            [searchParamKey]: specificParamValue,
            result: false,
          },
        });
      });
    }
    clearInterval(checkTimer);
  }
}, 200);
