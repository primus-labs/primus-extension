import { BASEVENTNAME } from '@/config/constants';
import { BNBGREENFIELDURL } from '@/config/envConstants';
let tabCreatedByPado;
let currExtentionId;

export const PadoWebsiteMsgListener = async (request, sender, sendResponse) => {
  const { name, params } = request;
  const { eventName, operation } = params;
  if (name === 'createTab') {
    if (eventName === 'LINEA_DEFI_VOYAGE') {
      let url = chrome.runtime.getURL(
        `home.html#/cred?fromEvents=${eventName}`
      );
      chrome.tabs.create({ url });
    } else if (eventName === BASEVENTNAME) {
      let url = chrome.runtime.getURL(`home.html#/events`);
      chrome.tabs.create({ url });
    }
  } else if (name === 'upperChain') {
    if (operation === 'openPadoWebsite') {
      tabCreatedByPado = await chrome.tabs.create({
        url: BNBGREENFIELDURL, // TODO
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
