let shortcutIcon = null;
let queryTimer = null;
const queryFaviconFn = () => {
  const clearIcon = document.querySelector(
    'link[rel="shortcut icon"], link[rel="icon"]'
  );
  const fuzzyIcon = document.querySelectorAll('link[rel*="icon"]')?.[0];
  shortcutIcon = clearIcon || fuzzyIcon;
  if (shortcutIcon) {
    console.log('shortcutIcon', shortcutIcon);
    const faviconUrl = shortcutIcon.href;
    chrome.runtime.sendMessage({
      type: 'devconsole',
      name: 'FAVICON_URL',
      params: {
        url: faviconUrl,
      },
    });
    if (queryTimer) {
      clearInterval(queryTimer);
      queryTimer = null;
    }
  }
};

queryFaviconFn();
if (!shortcutIcon) {
  queryTimer = setInterval(queryFaviconFn, 1000);
}
