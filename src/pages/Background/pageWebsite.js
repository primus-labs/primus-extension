import { BASEVENTNAME } from '@/config/events';
import { BNBGREENFIELDURL } from '@/config/envConstants';
let tabCreatedByPado;
let currExtentionId;

export const PadoWebsiteMsgListener = async (request, sender, sendResponse) => {
  const { name, params } = request;
  const { eventName, operation } = params;
  if (name === 'createTab') {
    if (eventName === 'LINEA_DEFI_VOYAGE') {
      createTabFn(`home.html#/cred?fromEvents=${eventName}`);
    } else if (eventName === BASEVENTNAME) {
      createTabFn(`home.html#/events`);
    } else {
      createTabFn(`home.html#/events`);
    }
  } else if (name === 'upperChain') {
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
  } else if (name === 'event') {
    const { eventName, methodName,path } = params;
    if (methodName === 'createTab') {
      createTabFn(path);
    }
  }
};

const createTabFn = (path) => {
  let url = chrome.runtime.getURL(path);
  chrome.tabs.create({ url });
}