const BASEVENTNAME = 'BAS_EVENT_PROOF_OF_HUMANITY';
const LINEAEVENTNAME = "LINEA_DEFI_VOYAGE";
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
// const fn = () => {
//   var entranceEl = document.querySelector('#LINEA_DEFI_VOYAGE_entrance');
//   console.log('pado-extension-entranceEl', entranceEl);
//   var EVENT_entranceEl = document.querySelector('#EVENT_entrance');
//   if (entranceEl) {
//     entranceEl.onclick = (e) => {
//       e.preventDefault();
//       chrome.runtime.sendMessage({
//         type: 'padoWebsite',
//         name: 'createTab',
//         params: {
//           eventName: 'LINEA_DEFI_VOYAGE',
//         },
//       });
//       return;
//     };
//   }
//   if (EVENT_entranceEl) {
//     EVENT_entranceEl.onclick = (e) => {
//       e.preventDefault();
//       chrome.runtime.sendMessage({
//         type: 'padoWebsite',
//         name: 'createTab',
//         params: {
//           eventName: '',
//         },
//       });
//       return;
//     };
//   }
// };
// fn();
// if (EventsNavEl) {
//   console.log('pado-extension-EventsNavEl', EventsNavEl);
//   EventsNavEl.addEventListener('click', () => {
//     setTimeout(() => {
//       fn();
//     }, 300);
//   });
// }
// Linea event
let checkLineaEventEntranceElTimer = null;
if (window.location.pathname === '/events') {
  checkLineaEventEntranceElTimer = setInterval(() => {
    var EventEntranceEl = document.querySelector('#LINEA_DEFI_VOYAGE_entrance');
    var EventJoinEl = document.querySelector('#EVENT_entrance');
    console.log('LINEA_DEFI_VOYAGE_entrance btn', EventEntranceEl);
    if (EventEntranceEl && EventJoinEl) {
      EventEntranceEl.onclick = (e) => {
        console.log('LINEA_DEFI_VOYAGE_entrance btn clicked ----');
        e.preventDefault();
        chrome.runtime.sendMessage({
          type: 'padoWebsite',
          name: 'createTab',
          params: {
            eventName: LINEAEVENTNAME,
          },
        });
        return;
      };
      EventJoinEl.onclick = (e) => {
        console.log('EVENT_entrance btn clicked ----');
        e.preventDefault();
        chrome.runtime.sendMessage({
          type: 'padoWebsite',
          name: 'createTab',
          params: {
            eventName: '',
          },
        });
        return;
      };
      clearInterval(checkLineaEventEntranceElTimer);
    }
  }, 200);
}

// BAS event
let checkBASEventEntranceElTimer = null;
if (
  window.location.pathname === '/basevent' ||
  window.location.pathname === '/events'
) {
  checkBASEventEntranceElTimer = setInterval(() => {
    var BASEventEntranceEl = document.querySelector(
      '#BAS_EVENT_PROOF_OF_HUMANITY_entrance'
    );
    console.log(
      '222 BAS_EVENT_PROOF_OF_HUMANITY_entrance btn',
      BASEventEntranceEl
    );
    if (BASEventEntranceEl) {
      BASEventEntranceEl.onclick = (e) => {
        console.log('222 BASEventEntranceEl clicked ----');
        e.preventDefault();
        chrome.runtime.sendMessage({
          type: 'padoWebsite',
          name: 'createTab',
          params: {
            eventName: BASEVENTNAME,
          },
        });
        return;
      };
      clearInterval(checkBASEventEntranceElTimer);
    }
  }, 200);
}

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
