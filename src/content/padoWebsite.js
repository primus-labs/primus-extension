var entranceEl = document.querySelector('#LINEA_DEFI_VOYAGE_entrance');
// window.PADO = 'pado'
// console.log('222111', window);

entranceEl.onclick = () => {
  
  chrome.runtime.sendMessage({
    type: 'padoWebsite',
    name: 'createTab',
    params: {
      eventName: 'LINEA_DEFI_VOYAGE',
    },
  });
  return;
};