import { BASEVENTNAME } from '@/config/constants';
import { BNBGREENFIELDSCHEMANAME } from '@/config/envConstants';
let tabCreatedByPado;
let icpPageTabId;

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
        url: BNBGREENFIELDSCHEMANAME, // TODO
      });
      icpPageTabId = sender.tab.id;
      console.log('22212345', icpPageTabId, tabCreatedByPado);
    } else if (operation === 'upperChain') {
      chrome.tabs.sendMessage(
        tabCreatedByPado.id,
        request,
        function (response) {}
      );
    }

    // else if () {

    // }

    // chrome.tabs.sendMessage(icpPageTabId, request, function (response) {});
  }
};
