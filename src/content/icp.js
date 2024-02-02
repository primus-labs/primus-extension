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
chrome.runtime.sendMessage(
  {
    type: 'icp',
    name: 'injectionCompleted',
  }
);

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  var {
    type,
    name,
    params: { requestid, attestationInfo },
  } = request;
  if (type === 'icp') {
    if (name === 'upperChain') {
      console.log('icp content receive upperChain', new Date());
      credRequestId = requestid;
      window.postMessage({
        target: 'padoIcp',
        name: 'upperChain',
        params: attestationInfo,
      });
      // const balance = await window.ic?.plug?.requestBalance();
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
    const { target, origin, name, params } = e.data;
    if (target === 'padoExtension' && origin === 'padoIcp') {
      console.log(
        `${target} receive message from ${origin}`,
        e.data,
        'credRequestId:',
        credRequestId
      );
      const { operation, result, params: resultParams } = params;
      if (name === 'connectWalletRes') {
        chrome.runtime.sendMessage({
          type: 'icp',
          name,
          result,
          params: resultParams,
        });
      } else if (name === 'upperChainRes') {
        const { attestationId, attestationDetailPath, signature } =
          resultParams;
        chrome.runtime.sendMessage({
          type: 'icp',
          name,
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
