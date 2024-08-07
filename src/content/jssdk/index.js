window.addEventListener('message', (e) => {
  const { target, name, params } = e.data;
  if (target === 'padoExtension' && origin === '') {
    if (name === 'initAttest') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'initAttest',
      });
    }
    if (name === 'startAttest') {
      chrome.runtime.sendMessage({
        type: 'padoZKAttestationJSSDK',
        name: 'startAttest',
      });
      // chrome.runtime.sendMessage({
      //   type: 'pageDecode',
      //   name: 'init',
      //   params: {
      //     ...currRequestTemplate,
      //     requestid,
      //   },
      //   extensionTabId: currentWindowTabs[0].id,
      //   operation: 'attest',
      // });
    }
  }
});
