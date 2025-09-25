window.onload = () => {
  let checkTimer = null;
  checkTimer = setInterval(() => {
    var element = document.querySelector(
      "[data-testid='confirmationSheetConfirm']"
    );
    // console.log('222x follow btn', element);
    if (element) {
      element.addEventListener('click', () => {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const pathname = url.pathname;
        const searchParams = url.searchParams;

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
        if (Object.keys(xEventMap).includes(pathname)) {
          const { searchParamKey, eventName } = xEventMap[pathname];
          const specificParamValue = searchParams.get(searchParamKey);
          chrome.runtime.sendMessage({
            type,
            name: eventName,
            params: {
              [searchParamKey]: specificParamValue,
            },
          });
          //   {
          //   type: 'xPage',
          //   name: 'follow',
          //   params: {
          //     screen_name: specificParamValue,
          //   },
          // }
        }
      });
      clearInterval(checkTimer);
    }
  }, 200);
};
