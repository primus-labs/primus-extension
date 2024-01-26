const BASEVENTNAME = 'BAS_EVENT_PROOF_OF_HUMANITY';
const LINEAEVENTNAME = 'LINEA_DEFI_VOYAGE';

var regenerateEl;
var upperChainEl;
var completeUpperChainEl;
window.pado = 'pado';
console.log('window in content', window.pado);
window.padoFn = (p) => {
  console.log('padoFn called');
};
function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
var padoStr = `<div id="pado-extension-inject-el"></div>`;
var injectEl = createDomElement(padoStr);
document.body.appendChild(injectEl);

window.addEventListener(
  'message',
  (e) => {
    const { target, name, params } = e.data;
    if (target === 'padoExtension') {
      console.log('padoExtension content onMessage', e.data);
      if (name === 'event') {
        const { eventName, methodName, path } = params;
        chrome.runtime.sendMessage({
          type: 'padoWebsite',
          name: 'event',
          params: {
            eventName,
            methodName,
            path
          },
        });
      }
    }
  },
  false
);

// BNB Greenfield upper chain
const regenerateFn = () => {
  regenerateEl = document.querySelector('#regenerate');
  upperChainEl = document.querySelector('#upperChain');
  completeUpperChainEl = document.querySelector('#completeUpperChain');
  console.log(
    '222pado-extension-regenerateEl',
    regenerateEl,
    upperChainEl,
    completeUpperChainEl
  );
  if (regenerateEl) {
    regenerateEl.onclick = (e) => {
      e.preventDefault();
      console.log('222regenerateEl clicked');
      chrome.runtime.sendMessage({
        type: 'padoWebsite',
        name: 'upperChain',
        params: {
          operation: 'regenerate',
          eventName: 'BAS_EVENT_PROOF_OF_HUMANITY',
        },
      });
      return;
    };
  }
  if (completeUpperChainEl) {
    completeUpperChainEl.onclick = async (e) => {
      console.log('222completeUpperChainEl clicked');
      const resStr = localStorage.getItem(
        'attestOffChainWithGreenFieldWithFixValueRes'
      );
      if (resStr) {
        const resObj = JSON.parse(resStr);
        const attestationUidArr = resObj.map((i) => i.attestationUid);
        const recipient =
          resObj[0].eip712MessageRawDataWithSignature.message.recipient;
        const { bucketName } = resObj[0];
        await chrome.runtime.sendMessage({
          type: 'padoWebsite',
          name: 'upperChain',
          params: {
            operation: 'completeUpperChain',
            eventName: 'BAS_EVENT_PROOF_OF_HUMANITY',
            attestationUidArr,
            recipient,
            result: true,
            bucketName,
          },
        });
        localStorage.removeItem('attestOffChainWithGreenFieldWithFixValue');
        localStorage.removeItem('attestOffChainWithGreenFieldWithFixValueRes');
      } else {
        chrome.runtime.sendMessage({
          type: 'padoWebsite',
          name: 'upperChain',
          params: {
            operation: 'completeUpperChain',
            eventName: 'BAS_EVENT_PROOF_OF_HUMANITY',
            result: false,
          },
        });
      }

      return;
    };
  }
};
regenerateFn();
setTimeout(() => {
  regenerateFn();
}, 300);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  var { type, name, params } = request;
  const { operation } = params;
  if (type === 'padoWebsite') {
    if (name === 'upperChain') {
      if (operation === 'upperChain') {
        localStorage.setItem(
          'attestOffChainWithGreenFieldWithFixValue',
          JSON.stringify(params)
        );
        console.log('222 content receive upperChain', params);
        upperChainEl.click();
      }
    }
  }
});
