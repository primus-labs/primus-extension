function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
var padoStr = `<div id="pado-extension-inject-el"></div>`;
var injectEl = createDomElement(padoStr);
var queryTimer = null;
document.body.appendChild(injectEl);
console.log('pado-extension-content inject');
// window.PADO = 'pado'
const fn = () => {
  var entranceEl = document.querySelector('#ConnectPadoNav');
  console.log('pado-extension-entranceEl', entranceEl, entranceEl.title);
  if (entranceEl) {
    entranceEl.onclick = (e) => {
      var entranceEl = document.querySelector('#ConnectPadoNav');
      console.log('click', entranceEl.title, e);
      if (entranceEl.title) {
        console.log('plug wallet', entranceEl.title);
        chrome.runtime.sendMessage({
          type: 'icp',
          name: 'createTab',
          params: {
            fromWallet: 'icp',
            fromWalletAddress: entranceEl.title,
          },
        });
      } else {
      }
    };
  }
};
fn();

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  var {
    name,
    params: { requestid, source, content, result },
  } = request;
  if (name === 'upperChain') {
    // const balance = await window.ic?.plug?.requestBalance();
    var entranceEl = document.querySelector('#UpperChainNav');
    entranceEl.requestid = requestid;
    localStorage.setItem(
      'padoUpperChainInfo',
      JSON.stringify({ source, content, result })
    );
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
