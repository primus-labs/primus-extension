import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
// import rem from '@/utils/rem.js';
import PButton from '@/newComponents/PButton';
import './index.scss';

let activeRequest;
function removeStorageValuesFn() {
  sessionStorage.removeItem('padoRequestStatus');
  sessionStorage.removeItem('padoRequestReady');
}
function FooterEl({ status, setStatus, isReadyFetch }) {
  const handleOK = useCallback(async () => {
    removeStorageValuesFn();
    var msgObj = {
      type: 'dataSourceWeb',
      name: 'close',
    };
    await chrome.runtime.sendMessage(msgObj);
  }, []);
  const handleCancel = useCallback(async () => {
    removeStorageValuesFn();
    var msgObj = {
      type: 'dataSourceWeb',
      name: 'cancel',
    };
    await chrome.runtime.sendMessage(msgObj);
  }, []);
  const handleConfirm = useCallback(async () => {
    var msgObj = {
      type: 'dataSourceWeb',
      name: 'start',
    };
    await chrome.runtime.sendMessage(msgObj);
    setStatus('verifying');
    sessionStorage.setItem('padoRequestStatus', status);
  }, []);
  return status === 'initialized' ? (
    <div className="footer initialized">
      <PButton
        text="Cancel"
        type="text2"
        className="cancelBtn"
        onClick={handleCancel}
      />
      <PButton
        text="Confirm"
        type="secondary"
        className="confirmBtn"
        disabled={!isReadyFetch}
        onClick={handleConfirm}
      />
    </div>
  ) : status === 'verifying' ? (
    <div className="footer verifying">
      <PButton
        text="Cancel"
        type="text2"
        className="cancelBtn"
        onClick={handleCancel}
      />
      <PButton
        text={<div class="loading-spinner"></div>}
        type="secondary"
        className="confirmBtn"
        disabled
        onClick={() => {}}
      />
    </div>
  ) : (
    <div className="footer result ">
      <PButton text="OK" type="text2" onClick={handleOK} />
    </div>
  );
}
function DescEl({ status }) {
  var iconSuc = chrome.runtime.getURL(`iconSucc.svg`);
  var iconFail = chrome.runtime.getURL(`iconFail.svg`);
  var host = activeRequest.datasourceTemplate.host;
  return status === 'initialized' ? (
    <div className="descWrapper initialized">
      <div className="label">Data Source</div>
      <div className="value">{host}</div>
    </div>
  ) : status === 'verifying' ? (
    <div className="descWrapper verifying">Connecting ...</div>
  ) : status === 'result' ? (
    <div className="descWrapper result suc">
      <div className="label">
        <img src={iconSuc} alt="" />
        <span>Connect successfully!</span>
      </div>
      <div className="value">Please return to PADO.</div>
    </div>
  ) : (
    <div className="descWrapper result fail">
      <div className="label">
        <img src={iconFail} alt="" />
        <span>Connect failed.</span>
      </div>
      <div className="value">Please return to PADO and try again.</div>
    </div>
  );
}
function PadoCard() {
  const [status, setStatus] = useState('initialized');
  const [isReadyFetch, setIsReadyFetch] = useState('initialized');
  var iconPado = chrome.runtime.getURL(`iconPado.svg`);
  var iconLink = chrome.runtime.getURL(`iconLink.svg`);

  const iconMap = {
    binance: chrome.runtime.getURL(`iconDataSourceBinance.svg`),
    coinbase: chrome.runtime.getURL(`iconDataSourceCoinbase.svg`),
    okx: chrome.runtime.getURL(`iconDataSourceOKX.svg`),
    x: chrome.runtime.getURL(`iconDataSourceTwitter.svg`),
    tiktok: chrome.runtime.getURL(`iconDataSourceTikTok.svg`),
  };
  var iconDataSource = iconMap[activeRequest.dataSource];

  // useEffect(() => {
  //   rem();
  // }, []);
  useEffect(() => {
    const lastStatus = sessionStorage.getItem('padoRequestStatus');
    const lastIsReadyFetch = sessionStorage.getItem('padoRequestReady');
    if (lastStatus) {
      setStatus(lastStatus);
    }
    if (lastIsReadyFetch) {
      setIsReadyFetch(!!lastIsReadyFetch);
    }
  }, []);
  useEffect(() => {
    const listenerFn = (request, sender, sendResponse) => {
      var {
        name,
        params: { result, failReason, isReady },
      } = request;
      // if (name === 'attestResult') {
      //   var padoRightEl = document.querySelector('.pado-right');
      //   var padoCenterCenterEl = document.querySelector('.pado-center-center');
      //   var padoCenterEl = document.querySelector('.pado-center');
      //   var {
      //     jumpTo,
      //     uiTemplate: { condition, subProofContent },
      //     processUiTemplate: { proofContent, successMsg, failedMsg },
      //     event,
      //   } = activeTemplate;
      //   var aactiveOrigin = new URL(jumpTo).origin;
      //   var aactiveDesc = successMsg;
      //   var fn = (tryFlag) => {
      //     var btnTxt = tryFlag ? 'Try again' : 'OK';
      //     var padoCenterBottomOKNode = createDomElement(
      //       `<div class="pado-center-bottom"><button class="okBtn">${btnTxt}</button></div>`
      //     );
      //     padoCenterBottomOKNode.onclick = () => {
      //       chrome.runtime.sendMessage({
      //         type: 'pageDecode',
      //         name: 'closeDataSourcePage',
      //         dataSourcePageTabId,
      //         tryFlag,
      //       });
      //       return;
      //     };
      //     if (padoCenterEl.lastChild.className !== 'pado-center-bottom') {
      //       padoCenterEl.appendChild(padoCenterBottomOKNode);
      //     }
      //   };
      //   if (result === 'success') {
      //     padoRightEl.innerHTML = '3/3';
      //     var iconSuc = chrome.runtime.getURL(`iconSuc.svg`);
      //     padoCenterCenterEl.innerHTML = `<p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Result</span><span>${aactiveDesc}<img src=${iconSuc}></span></p>`;
      //     fn();
      //   } else if (result === 'fail') {
      //     aactiveDesc = failedMsg;
      //     padoRightEl.innerHTML = '3/3';
      //     padoCenterCenterEl.innerHTML = `<p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Result</span><span>${aactiveDesc}</span></p>`;
      //     fn();
      //   } else if (result === 'warn') {
      //     padoRightEl.innerHTML = '2/3';
      //     var str3 = `<p>Not meeting the uniqueness requirement...</p><p>This account may have already been bound to a wallet address, or your wallet address may already have a zkAttestation with another Binance account.</p>`;
      //     padoCenterCenterEl.innerHTML =
      //       failReason === 'Not meeting the uniqueness requirement.'
      //         ? str3
      //         : `<p class="warn-tip">${failReason.title}</p><p>${failReason.desc}</p>`;
      //     fn();
      //   }
      // }
      if (name === 'webRequestIsReady') {
        console.log('content receive:webRequestIsReady');
        setIsReadyFetch(true);
        sessionStorage.setItem('padoRequestReady', '1');
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listenerFn);
    };
  }, []);
  return (
    <div className={`pado-extension-card  ${status}`}>
      <div className="header">
        <img src={iconPado} className="iconPado" />
        <img src={iconLink} className="iconLink" />
        <img src={iconDataSource} className="iconSource" />
      </div>
      <div className="center">
        <p className="title">PADO Data Connection Process</p>
        <DescEl status={status} />
      </div>
      <FooterEl
        status={status}
        setStatus={setStatus}
        isReadyFetch={isReadyFetch}
      />
    </div>
  );
}
function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
var padoStr = `<div id="pado-extension-content"></div>`;
var injectEl = createDomElement(padoStr);
document.body.appendChild(injectEl);

chrome.runtime.sendMessage(
  {
    type: 'dataSourceWeb',
    name: 'initCompleted',
  },
  (response, a, b) => {
    if (response.name === 'append') {
      var disabledPathList = ['login', 'register'];
      var isDisabled = disabledPathList.some(
        (i) => window.location.href.indexOf(i) > -1
      );
      if (isDisabled) {
        return;
      }
      if (activeRequest) {
        if (response.isReady) {
          sessionStorage.setItem('padoRequestReady', '1');
        }
        return;
      }
      activeRequest = response.params;
      const container = document.getElementById('pado-extension-content');
      const root = createRoot(container);
      root.render(<PadoCard />);
    }
  }
);
