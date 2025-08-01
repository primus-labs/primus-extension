import React from 'react';
function HeaderEl() {
  var iconPado = chrome.runtime.getURL(`kaito.png`);
  console.log('process.env.REACT_APP_ENV', process.env.REACT_APP_ENV);
  return (
    <div className="pado-extension-header">
      <img src={iconPado} className="iconPado" />
      <div className="pado-extenstion-center-title">Verify Your Data</div>
    </div>
  );
}

export default HeaderEl;
