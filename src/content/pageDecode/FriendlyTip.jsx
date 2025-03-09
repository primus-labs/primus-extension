import React from 'react';
const FriendlyTip = ({ tipKey }) => {
  const tipMap = {
    toLogin: 'Login to start...',
    toMessage: 'Message GPT and wait for a reply...',
    toVerify: 'Processing the data parameters...',
  };
  var iconPrimusSquare = chrome.runtime.getURL(`iconPrimusSquare.svg`);
  return (
    <div className="tipStep">
      <img src={iconPrimusSquare} className="iconPrimusSquare" />
      <div className="tip">{tipMap[tipKey]}</div>
    </div>
  );
};

export default FriendlyTip;
