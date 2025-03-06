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
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const searchParams = url.searchParams;
        const specificParamValue = searchParams.get('screen_name');
        console.log('222x follow btn clicked', specificParamValue);
        chrome.runtime.sendMessage({
          type: 'xFollow',
          name: 'follow',
          params: {
            screen_name: specificParamValue,
          },
        });
      });
      clearInterval(checkFollowElTimer);
    }
  }, 200);
};
