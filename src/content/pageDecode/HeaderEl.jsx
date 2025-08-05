import React from 'react';
function HeaderEl({ extensionName }) {
  var iconPado = chrome.runtime.getURL(`iconPado.svg`);
  if (extensionName === 'kaito') {
    iconPado = chrome.runtime.getURL(`kaito.png`);
  } else if (extensionName === 'buidlpad') {
    iconPado = chrome.runtime.getURL(`buidlpad.png`);
  }
  return (
    <div className="pado-extension-header">
      <img src={iconPado} className="iconPado" />
      <div className="pado-extenstion-center-title">Verify Your Data</div>
    </div>
  );
}

export default HeaderEl;
