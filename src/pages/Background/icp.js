let tabCreatedByPado;
let icpPageTabId;
let padoExtensionId;

export const icpMsgListener = async (
  request,
  sender,
  sendResponse,
  password
) => {
  const { name, params, result } = request;
  if (name === 'upperChain') {
    // console.log('upperChain-from bg2', icpPageTabId);
    chrome.tabs.sendMessage(icpPageTabId, request, function (response) {});
  } else if (name === 'connectWallet') {
    const { walletName, operation, path } = params;
    if (operation === 'createTab') {
      const tabCreatedByPado = await chrome.tabs.create({ url: path });
      padoExtensionId = sender.tab.id;
      icpPageTabId = tabCreatedByPado.id;
      console.log('222icpPageTabId:', icpPageTabId);
    }
    if (result === true || result === false) {
      console.log('222yyytest');
      setTimeout(async () => {
        await chrome.tabs.update(padoExtensionId, {
          active: true,
        });
        // sender.tab.id === icpPageTabId
        await chrome.tabs.remove(sender.tab.id);
      }, 2000);
      chrome.runtime.sendMessage(request);
    }
  }
};
