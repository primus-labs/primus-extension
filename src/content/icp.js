function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
var padoStr = `<div id="pado-extension-inject-el"></div>`;
var injectEl = createDomElement(padoStr);
var queryTimer = null;
document.body.appendChild(injectEl);
console.log('222123icp');
// window.PADO = 'pado'
const fn = () => {
  var entranceEl = document.querySelector('#ConnectPadoNav');
  console.log('pado-extension-entranceEl', entranceEl, entranceEl.title);
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
    params: { requestid },
  } = request;
  if (name === 'upperChain') {
    console.log('2221', 'upperChain-from extention');
    // const balance = await window.ic?.plug?.requestBalance();
    var entranceEl = document.querySelector('#UpperChainNav');
    entranceEl.requestid = requestid;
    await entranceEl.click();
    queryTimer = setInterval(() => {
      if (entranceEl.title) {
        const icpBalance = localStorage.getItem('icpBalance');
        clearInterval(queryTimer);
        console.log('22212', icpBalance, entranceEl.title);
        var msgObj = {
          type: 'icp',
          name: 'upperChainRes',
          params: {
            txHash: entranceEl.title,
            extra: icpBalance,
            requestid,
          },
        };
        chrome.runtime.sendMessage(msgObj, (response) => {});
      }
    }, 300);
  }
});
