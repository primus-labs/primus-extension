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

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  var {
    type,
    name,
    params: { requestid, attestationInfo },
  } = request;
  if (type === 'icp') {
    if (name === 'upperChain') {
      window.postMessage({
        target: 'padoIcp',
        name: 'upperChain',
        params: attestationInfo,
      });
      // const balance = await window.ic?.plug?.requestBalance();

      credRequestId = requestid;
    }
    if (name === 'upperChainRes') {
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
  }
});

window.addEventListener(
  'message',
  (e) => {
    const { target, name, params } = e.data;
    if (target === 'padoExtension' && name === 'icp') {
      console.log(
        'padoExtension content onMessage',
        e.data,
        'credRequestId:',
        credRequestId
      );
      const { operation, result, params: resultParams } = params;
      if (operation === 'connectWallet') {
        chrome.runtime.sendMessage({
          type: 'icp',
          name: operation,
          result,
          params: resultParams,
        });
      } else if (operation === 'upperChain') {
        const { attestationId, attestationDetailPath, signature } =
          resultParams;
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
  },
  false
);
