function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
var padoStr = `<div id="pado-extension-inject-el"></div>`;
var injectEl = createDomElement(padoStr);
document.body.appendChild(injectEl);

window.onload = () => {
  console.log('onload');
  setTimeout(() => {
    var element = document.querySelector(
      "[data-testid='confirmationSheetConfirm']"
    );
    console.log('222123element', element);
    if (element) {
      element.addEventListener('click', () => {
        console.log('222123click');
        chrome.runtime.sendMessage({
          type: 'xFollow',
          name: 'follow',
        });
      });
    }
  }, 1000);
};
