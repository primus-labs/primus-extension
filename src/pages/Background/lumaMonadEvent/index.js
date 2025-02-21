let callerTabId;
let createdTabIdByExtension;

export const listener = async (request, sender) => {
  const { type, name, params } = request;

  if (name === 'followX') {
    callerTabId = null;
    callerTabId = sender.tab.id;
    const url = `https://twitter.com/intent/follow?screen_name=${params.screen_name}`;
    const tabCreatedByPado = await chrome.tabs.create({
      url,
    });
    createdTabIdByExtension = tabCreatedByPado.id;
  } else if (type === 'xFollow' && name === 'follow') {
    if (createdTabIdByExtension) {
      await chrome.tabs.remove(createdTabIdByExtension);
      chrome.tabs.sendMessage(callerTabId, {
        type: 'lumaMonadEvent',
        name: 'followXRes',
        params,
      });
      await chrome.tabs.update(callerTabId, {
        active: true,
      });
    }
  }
};
