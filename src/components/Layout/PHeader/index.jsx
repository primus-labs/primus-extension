import React from 'react';
import './index.sass'
import logo from '@/assets/img/logo.svg';
const PHeader = () => {
  return (
    <header className="pHeader">
        <img src={logo} className="pLogo" alt="logo" />
        <i></i>
        <p>Privacy-preserving Attestation Data Operator</p>
      </header>
  );
};

export default PHeader;
