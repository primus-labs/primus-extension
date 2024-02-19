import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import PButton from '@/newComponents/PButton';
import './index.scss';
console.log('content-dataSourceWeb');

function FooterEl() {
  const handleCancel = useCallback(() => {}, []);
  const handleConfirm = useCallback(() => {}, []);
  return (
    <div className="footer initialized">
      <PButton text="Cancel" type="text2" onClick={handleCancel} />
      <PButton text="Confirm" type="secondary" onClick={handleConfirm} />
    </div>
  );
  return (
    <div className="footer verifying">
      {' '}
      <PButton text="OK" type="text2" onClick={handleOK} />
    </div>
  );
  return (
    <div className="footer result suc">
      <PButton text="OK" type="text2" onClick={handleOK} />
    </div>
  );
  return (
    <div className="footer result fail">
      <PButton text="OK" type="text2" onClick={handleOK} />
    </div>
  );
}
function DescEl() {
  var iconSuc = chrome.runtime.getURL(`iconSucc.svg`);
  var iconFail = chrome.runtime.getURL(`iconFail.svg`);
  return (
    <div className="descWrapper initialized">
      <div className="label">Data Source</div>
      <div className="value">https:// www.biannce.com</div>
    </div>
  );
  return <div className="descWrapper verifying">Verifying ...</div>;
  return (
    <div className="descWrapper result suc">
      <div className="label">
        <img src={iconSuc} alt="" />
        <span>Connect successfully!</span>
      </div>
      <div className="value">Please return to PADO.</div>
    </div>
  );
  return (
    <div className="descWrapper result fail">
      <div className="label">
        <img src={iconFail} alt="" />
        <span>Connect failed.</span>
      </div>
      <div className="value">Please return to PADO and try again.</div>
    </div>
  );
}
function MyButton() {
  var iconPado = chrome.runtime.getURL(`iconPado.svg`);
  var iconLink = chrome.runtime.getURL(`iconLink.svg`);
  var iconDataSourceBinance = chrome.runtime.getURL(
    `iconDataSourceBinance.svg`
  );
  return (
    <div className="pado-extension-card result">
      <div className="header">
        <img src={iconPado} className="iconPado" />
        <img src={iconLink} className="iconLink" />
        <img src={iconDataSourceBinance} className="iconSource" />
      </div>
      <div className="center">
        <p className="title">PADO Data Connection Process</p>
        <DescEl />
      </div>
      <FooterEl/>
    </div>
  );
}
var padoStr = `<div id="pado-extension-content"></div>`;
var injectEl = createDomElement(padoStr);
document.body.appendChild(injectEl);
const container = document.getElementById('pado-extension-content');
const root = createRoot(container);
root.render(<MyButton />);
