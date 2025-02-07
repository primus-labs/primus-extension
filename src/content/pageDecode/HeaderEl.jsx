import React from 'react';
function HeaderEl() {
  var iconPado = chrome.runtime.getURL(`iconPado.svg`);
  return (
    <div className="pado-extension-header">
      <img src={iconPado} className="iconPado" />
      <div className="pado-extenstion-center-title">Verify Your Data</div>
    </div>
  );
}

export default HeaderEl;
