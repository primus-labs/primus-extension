function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
var padoStr = `<div id="pado-extension-inject-el"></div>`;
var injectEl = createDomElement(padoStr);
document.body.appendChild(injectEl);

window.onload = () => {
  let checkFollowElTimer = null;
  checkFollowElTimer = setInterval(() => {
    var element = document.querySelector(
      "[data-testid='confirmationSheetConfirm']"
    );
    console.log('222x follow btn', element);
    if (element) {
      element.addEventListener('click', () => {
        console.log('222x follow btn clicked');
        chrome.runtime.sendMessage({
          type: 'xFollow',
          name: 'follow',
        });
      });
      clearInterval(checkFollowElTimer);
    }
  }, 200);
};
