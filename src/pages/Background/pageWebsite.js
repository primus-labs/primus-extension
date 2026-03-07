import { BNBGREENFIELDURL } from '@/config/envConstants';
let tabCreatedByPado;
let currExtentionId;

export const PadoWebsiteMsgListener = async (request, sender, sendResponse) => {
  const { name, params } = request;
  const { operation } = params;
  if (name === 'upperChain') {
    if (operation === 'openPadoWebsite') {
      tabCreatedByPado = await chrome.tabs.create({
        url: BNBGREENFIELDURL,
      });
      currExtentionId = sender.tab.id;
      console.log('22212345', currExtentionId, tabCreatedByPado);
    } else if (operation === 'upperChain') {
      chrome.tabs.sendMessage(
        tabCreatedByPado.id,
        request,
        function (response) {}
      );
    } else if (operation === 'completeUpperChain') {
      setTimeout(async () => {
        await chrome.tabs.update(currExtentionId, {
          active: true,
        });
        await chrome.tabs.remove(tabCreatedByPado.id);
      }, 2000);
    }
  }
};