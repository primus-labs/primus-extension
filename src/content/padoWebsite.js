var entranceEl = document.querySelector('#LINEA_DEFI_VOYAGE_entrance');
// window.PADO = 'pado'

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
