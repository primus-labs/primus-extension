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
const pageMsgType = 'xPage';

const bindings = [
  {
    selector: "[data-testid='confirmationSheetConfirm']",
    handler: confirmHandler,
  },
  {
    selector: "[data-testid='confirmationSheetCancel']",
    handler: cancelHandler,
  },
];

function confirmHandler() {
  console.log('confirm btn clicked');
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  if (Object.keys(xEventMap).includes(pathname)) {
    const { searchParamKey, eventName } = xEventMap[pathname];
    const specificParamValue = searchParams.get(searchParamKey);
    chrome.runtime.sendMessage({
      type: pageMsgType,
      name: eventName,
      params: {
        [searchParamKey]: specificParamValue,
        result: true,
      },
    });
  }
}

function cancelHandler() {
  console.log('cancel btn clicked');
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  if (Object.keys(xEventMap).includes(pathname)) {
    const { searchParamKey, eventName } = xEventMap[pathname];
    const specificParamValue = searchParams.get(searchParamKey);
    chrome.runtime.sendMessage({
      type: pageMsgType,
      name: eventName,
      params: {
        [searchParamKey]: specificParamValue,
        result: false,
      },
    });
  }
}

function bindIfExists(selector, handler) {
  const el = document.querySelector(selector);
  if (el && !el.dataset.bound) {
    el.dataset.bound = 'true';
    el.addEventListener('click', handler);
    console.log(`[bound] ${selector}`);
  }
}

function tryBindAll() {
  for (const { selector, handler } of bindings) {
    bindIfExists(selector, handler);
  }
}

tryBindAll();

const observer = new MutationObserver(tryBindAll);
observer.observe(document.body, { childList: true, subtree: true });
