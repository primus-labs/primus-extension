import React, { memo } from 'react';
import './index.sass';
import logo from '@/assets/img/logo.svg';
const PHeader = memo(() => {
  return (
    <div className="appHeader">
      <header className="pHeader">
        <img src={logo} className="pLogo" alt="" />
        <i></i>
        <div className="logoText">
          <p>Privacy-preserving Attestation Data Operator</p>
        </div>
      </header>
    </div>
  );
});

export default PHeader;
