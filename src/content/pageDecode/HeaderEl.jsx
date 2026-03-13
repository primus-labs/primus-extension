import React from 'react';

function HeaderEl() {
  const iconPado = chrome.runtime.getURL('iconPado.svg');
  return (
    <div className="pado-extension-header">
      <img src={iconPado} alt="" className="iconPado" />
      <div className="pado-extension-center-title">Verify Your Data</div>
    </div>
  );
}

export default HeaderEl;
