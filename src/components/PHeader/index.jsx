import React from 'react';
import './index.sass'
import logo from '../../assets/img/logo.svg';
const PHeader = () => {
  return (
    <header className="pHeader">
        <img src={logo} className="App-logo" alt="logo" />
        <i></i>
        <p>Privacy-preserving Authenticated Data Operator</p>
      </header>
  );
};

export default PHeader;
