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

function getCurrentXEventContext() {
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  if (!Object.prototype.hasOwnProperty.call(xEventMap, pathname)) {
    return null;
  }
  const { searchParamKey, eventName } = xEventMap[pathname];
  return {
    eventName,
    searchParamKey,
    specificParamValue: searchParams.get(searchParamKey),
  };
}

function sendXPageResult(result) {
  const context = getCurrentXEventContext();
  if (!context) {
    return;
  }
  const { eventName, searchParamKey, specificParamValue } = context;
  chrome.runtime.sendMessage({
    type: pageMsgType,
    name: eventName,
    params: {
      [searchParamKey]: specificParamValue,
      result,
    },
  });
}

function confirmHandler() {
  sendXPageResult(true);
}

function cancelHandler() {
  sendXPageResult(false);
}

function bindIfExists(selector, handler) {
  const el = document.querySelector(selector);
  if (el && !el.dataset.bound) {
    el.dataset.bound = 'true';
    el.addEventListener('click', handler);
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
