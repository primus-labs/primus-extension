let tabCreatedByPado;
let icpPageTabId;
let padoExtensionId;
let upperChainRequest;
const icpPath = 'https://bupby-pqaaa-aaaam-abykq-cai.icp0.io/';

export const icpMsgListener = async (
  request,
  sender,
  sendResponse,
  password
) => {
  const { name, params, result } = request;
  if (name === 'injectionCompleted') {
    if (icpPageTabId && upperChainRequest) {
      console.log('send upperChain to icp', new Date());
      chrome.tabs.sendMessage(
        icpPageTabId,
        upperChainRequest,
        function (response) {}
      );
    }
  } else if (name === 'upperChain') {
    icpPageTabId = await createTabFn(icpPath + '&operation=upperChain');
    console.log('create icp tab', icpPageTabId);
    upperChainRequest = request;
  } else if (name === 'connectWallet') {
    const { walletName, operation, path } = params;
    padoExtensionId = sender.tab.id;
    icpPageTabId = await createTabFn(icpPath + '&operation=connectWallet');
    console.log('create icp tab', icpPageTabId);
    // }
  } else if (name === 'connectWalletRes') {
    await ActiveAremoveTabFn(padoExtensionId, sender.tab.id);
  } else if (name === 'upperChainRes') {
    upperChainRequest = null;
    await ActiveAremoveTabFn(padoExtensionId, sender.tab.id);
  }
};
const createTabFn = async (path) => {
  let url;
  if (path.startsWith('http') || path.startsWith('https')) {
    url = path;
  } else {
    url = chrome.runtime.getURL(path);
  }
  const res = await chrome.tabs.create({ url });
  return res.id;
};
const ActiveAremoveTabFn = async (activeId, removeId) => {
  setTimeout(async () => {
    await chrome.tabs.update(activeId, {
      active: true,
    });
    await chrome.tabs.remove(removeId);
  }, 800);
};
