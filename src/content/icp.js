function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
var padoStr = `<div id="pado-extension-inject-el"></div>`;
var injectEl = createDomElement(padoStr);
var queryTimer = null;
var credRequestId = null;
document.body.appendChild(injectEl);
console.log('222123icp');
// window.PADO = 'pado'
const fn = () => {
  var entranceEl = document.querySelector('#ConnectPadoNav');
  console.log('pado-extension-entranceEl', entranceEl);
  if (entranceEl) {
    entranceEl.onclick = (e) => {
      e.preventDefault();
      console.log('plug wallet', entranceEl.title);
      chrome.runtime.sendMessage({
        type: 'icp',
        name: 'createTab',
        params: {
          fromWallet: 'icp',
          fromWalletAddress: entranceEl.title,
        },
      });
      return;
    };
  }
};
fn();

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  var {
    name,
    params: { requestid, attestationInfo },
  } = request;
  if (name === 'upperChain') {
    // const balance = await window.ic?.plug?.requestBalance();
    var entranceEl = document.querySelector('#UpperChainNav');
    entranceEl.requestid = requestid;
    credRequestId = requestid;
    localStorage.setItem('padoUpperChainInfo', JSON.stringify(attestationInfo));
    await entranceEl.click();
    queryTimer = setInterval(() => {
      if (entranceEl.title) {
        clearInterval(queryTimer);
        var msgObj = {
          type: 'icp',
          name: 'upperChainRes',
          params: {
            txHash: entranceEl.title,
            requestid,
          },
        };
        chrome.runtime.sendMessage(msgObj, (response) => {});
      }
    }, 300);
  }
});

window.addEventListener(
  'message',
  (e) => {
    const { target, name, params } = e.data;
    if (target === 'padoExtension') {
      if (name === 'icp') {
        console.log(
          'padoExtension content onMessage',
          e.data,
          'credRequestId:',
          credRequestId
        );
        const { operation, result, params: resultParams } = params;
        if (operation === 'upperChain') {
          const { attestationId, attestationDetailPath,signature } = resultParams;
          chrome.runtime.sendMessage({
            type: 'icp',
            name: 'upperChainRes',
            result,
            params: {
              attestationId,
              attestationDetailPath,
              requestId: credRequestId,
              signature,
            },
          });
        }
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
