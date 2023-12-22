let tabCreatedByPado;
let icpPageTabId;

export const icpMsgListener = async (
  request,
  sender,
  sendResponse,
  password
) => {
  const {
    name,
    params: { fromWallet, fromWalletAddress, txHash, extra },
  } = request;
  if (name === 'createTab') {
    let url = chrome.runtime.getURL(
      `home.html#/cred?fromWallet=${fromWallet}&fromWalletAddress=${fromWalletAddress}`
    );
   const tabCreatedByPado =  await chrome.tabs.create({ url });
    icpPageTabId = sender.tab.id;
    console.log('22212345', icpPageTabId, tabCreatedByPado);
  }
  if (name === 'upperChain') {
    // console.log('upperChain-from bg2', icpPageTabId);
    chrome.tabs.sendMessage(icpPageTabId, request, function (response) {});
  }
};
