var padoExtenstionTabId = null;
var regenerateEl;
var upperChainEl;
var completeUpperChainEl;
function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
var padoStr = `<div id="pado-extension-inject-el"></div>`;
var injectEl = createDomElement(padoStr);
document.body.appendChild(injectEl);

var EventsNavEl = document.querySelector('#EventsNav');

// window.PADO = 'pado'
const fn = () => {
  var entranceEl = document.querySelector('#LINEA_DEFI_VOYAGE_entrance');
  console.log('pado-extension-entranceEl', entranceEl);
  if (entranceEl) {
    entranceEl.onclick = (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({
        type: 'padoWebsite',
        name: 'createTab',
        params: {
          eventName: 'LINEA_DEFI_VOYAGE',
        },
      });
      return;
    };
  }
};
fn();
if (EventsNavEl) {
  console.log('pado-extension-EventsNavEl', EventsNavEl);
  EventsNavEl.addEventListener('click', () => {
    setTimeout(() => {
      fn();
    }, 300);
  });
}

const regenerateFn = () => {
  regenerateEl = document.querySelector('#regenerate');
  upperChainEl = document.querySelector('#upperChain');
  completeUpperChainEl = document.querySelector('#completeChain');
  console.log('222pado-extension-regenerateEl', regenerateEl, upperChainEl);
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
    completeUpperChainEl.onclick = (e) => {
      console.log('222completeUpperChainEl clicked');
      const resStr = localStorage.geItem(
        'attestOffChainWithGreenFieldWithFixValueRes'
      );
      if (resStr) {
        const resObj = JSON.parse(resStr);
        const attestationUidArr = resObj.map((i) => i.attestationUid);
        const recipient =
          attestationUidArr[0].eip712MessageRawDataWithSignature.message
            .recipient;

        chrome.runtime.sendMessage({
          type: 'padoWebsite',
          name: 'upperChain',
          params: {
            operation: 'completeUpperChain',
            eventName: 'BAS_EVENT_PROOF_OF_HUMANITY',
            attestationUidArr,
            recipient,
            result: true,
          },
        });
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
