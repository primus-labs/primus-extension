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
