const shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
console.log('shortcutIcon', shortcutIcon);
if (shortcutIcon) {
  const faviconUrl = shortcutIcon.href;
  console.log('Favicon URL:', faviconUrl);

  // chrome.runtime.sendMessage({
  //   type: 'devconsole',
  //   name: 'FAVICON_URL',
  //   params: {
  //     url: faviconUrl,
  //   },
  // });

  // window.postMessage(
  //   {
  //     target: 'devconsole',
  //     origin: 'primusExtension',
  //     name: 'FAVICON_URL',
  //     params: {
  //       url: faviconUrl,
  //     },
  //   },
  //   '*'
  // );
  chrome.runtime.sendMessage({
    type: 'devconsole',
    name: 'FAVICON_URL',
    params: {
      url: faviconUrl,
    },
  });
} else {
  console.log('No shortcut icon found on this page.');
}
