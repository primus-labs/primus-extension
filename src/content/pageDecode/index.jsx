import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
// import rem from '@/utils/rem.js';
import PButton from '@/newComponents/PButton';
import './index.scss';

let activeRequest;
let operationType;
let attestType;
function removeStorageValuesFn() {
  sessionStorage.removeItem('padoAttestRequestStatus');
  sessionStorage.removeItem('padoAttestRequestReady');
  activeRequest = null;
  operationType = null;
}
function FooterEl({ status, setStatus, isReadyFetch, resultStatus }) {
  const handleOK = useCallback(async () => {
    removeStorageValuesFn();
    var msgObj = {
      type: 'pageDecode',
      name: 'close',
    };
    await chrome.runtime.sendMessage(msgObj);
  }, []);
  const handleCancel = useCallback(async () => {
    removeStorageValuesFn();
    var msgObj = {
      type: 'pageDecode',
      name: 'cancel',
    };
    await chrome.runtime.sendMessage(msgObj);
  }, []);
  const handleConfirm = useCallback(async () => {
    var msgObj = {
      type: 'pageDecode',
      name: 'start',
    };
    await chrome.runtime.sendMessage(msgObj);
    setStatus('verifying');
    sessionStorage.setItem('padoAttestRequestStatus', status);
  }, []);
  return status === 'initialized' ? (
    <div className="pado-extension-footer initialized">
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
    <div className="pado-extension-footer verifying">
      <PButton
        text="Cancel"
        type="text2"
        className="cancelBtn"
        onClick={handleCancel}
      />
      <PButton
        text={<div className="loading-spinner"></div>}
        type="secondary"
        className="confirmBtn"
        disabled
        onClick={() => {}}
      />
    </div>
  ) : (
    <div className="pado-extension-footer result ">
      <PButton text="OK" type="text2" onClick={handleOK} />
    </div>
  );
}
function DataSourceLineEl({ list }) {
  return (
    <ul className="descWrapper initialized">
      {list.map((i) => {
        return (
          <li className="descItem" key={i.label}>
            <div className="label">{i.label}</div>
            <div className="value">{i.value}</div>
          </li>
        );
      })}
    </ul>
  );
}
function DescEl({ status, resultStatus, errorTxt }) {
  console.log('222DescEl', errorTxt);
  var iconSuc = chrome.runtime.getURL(`iconSucc.svg`);
  var iconFail = chrome.runtime.getURL(`iconFail.svg`);
  var host = activeRequest.jumpTo
    ? new URL(activeRequest.jumpTo).origin
    : activeRequest.datasourceTemplate.host;

  var uiTemplate = activeRequest.uiTemplate;
  const [loadingTxt, setLoadingTxt] = useState('Connecting to PADO node...');
  const [errorTxtSelf, setErrorTxtSelf] = useState({
    sourcePageTip: 'Error Message.',
  });
  useEffect(() => {
    setErrorTxtSelf(errorTxt);
  }, [errorTxt]);
  const descList = useMemo(() => {
    if (operationType === 'connect') {
      return [{ label: 'Data Source', value: host }];
    } else {
      const { attestationType, verificationContent, verificationValue } =
        activeRequest;

      let vC = verificationContent,
        vV = verificationValue;
      if (attestationType === 'Assets Verification') {
        if (verificationContent === 'Assets Proof') {
          vC = 'Asset balance';
          vV = `> $${verificationValue}`;
        } else if (verificationContent === 'Token Holding') {
          vC = 'Token holding';
        }
      } else if (attestationType === 'Social Connections') {
        if (verificationContent === 'X Followers') {
          vC = 'Followers number';
          vV = `> ${verificationValue}`;
        }
      }

      return [
        { label: 'Data Source', value: host },
        {
          label: 'Verification Content',
          value: vC,
        },
        { label: 'Verification Value', value: vV },
      ];
    }
  }, []);
  // const loadingTxt = useMemo(() => {
  //   if (operationType === 'connect') {
  //     return 'Connecting ...';
  //   } else {
  //     return 'Verifying ...';
  //   }
  // }, []);
  useEffect(() => {
    let str = '';
    if (operationType === 'connect') {
      str = 'Connecting ...';
      setLoadingTxt(str);
    } else {
      str = 'Connecting to PADO node...';
      setLoadingTxt(str);
      var progressPercentage = 0;
      function simulateFileUpload() {
        progressPercentage += 1;
        if (progressPercentage > 0 && progressPercentage <= 2) {
          // 1.25
          str = 'Connecting to PADO node...';
        } else if (progressPercentage > 2 && progressPercentage <= 3) {
          // 6.25
          // 1.25 - 2.5
          str = 'Connecting to data source...';
        } else if (progressPercentage > 3 && progressPercentage <= 18) {
          // 12.5
          // 2.5 - 5
          str = 'MPC-TLS executing...';
        } else if (progressPercentage > 18 && progressPercentage < 300) {
          // 5 - 100
          str = 'IZK proving and verifying...';
        } else if (progressPercentage >= 300) {
          str = 'Attestation creation completed ...';

          clearInterval(intervalTimer);
          if (!resultStatus) {
            setErrorTxtSelf({
              sourcePageTip: 'Request Timed Out',
            });
          }
        }
        setLoadingTxt(str);
      }
      var intervalTimer = setInterval(simulateFileUpload, 1000); // algorithm timeout
    }
  }, [operationType, resultStatus]);
  const sucTxt = useMemo(() => {
    if (operationType === 'connect') {
      return 'Connect successfully!';
    } else {
      return 'Verified!';
    }
  }, []);

  return status === 'initialized' ? (
    <DataSourceLineEl list={descList} />
  ) : status === 'verifying' ? (
    <div className="descWrapper verifying">{loadingTxt}</div>
  ) : status === 'result' && resultStatus === 'success' ? (
    <div className="descWrapper result suc">
      <div className="label">
        <img src={iconSuc} alt="" />
        <span>{sucTxt}</span>
      </div>
      <div className="value">Please return to PADO.</div>
    </div>
  ) : (
    <div className="descWrapper result fail">
      <div className="label">
        <div className="errorTipWrapper">
          <img src={iconFail} alt="" />
          <span>{errorTxtSelf?.sourcePageTip}</span>
        </div>
        {errorTxtSelf?.code && (
          <span className="errorCode">{errorTxtSelf?.code}</span>
        )}
      </div>
      <div className="value">Please return to PADO and try again.</div>
    </div>
  );
}
function PadoCard() {
  const [status, setStatus] = useState('initialized');
  const [isReadyFetch, setIsReadyFetch] = useState(false);
  const [resultStatus, setResultStatus] = useState('');
  const [errorTxt, setErrorTxt] = useState();
  useEffect(() => {
    let str = {};
    if (operationType === 'connect') {
      str = { title: 'Connect failed.' };
    } else {
      str = { title: 'Error Message.' };
    }
    setErrorTxt(str);
  }, [operationType]);
  var iconPado = chrome.runtime.getURL(`iconPado.svg`);
  var iconLink = chrome.runtime.getURL(`iconLink.svg`);

  const iconMap = {
    binance: chrome.runtime.getURL(`iconDataSourceBinance.svg`),
    coinbase: chrome.runtime.getURL(`iconDataSourceCoinbase.svg`),
    okx: chrome.runtime.getURL(`iconDataSourceOKX.svg`),
    x: chrome.runtime.getURL(`iconDataSourceTwitter.svg`),
    tiktok: chrome.runtime.getURL(`iconDataSourceTikTok.svg`),
    bitget: chrome.runtime.getURL(`iconDataSourceBitget.svg`),
    gate: chrome.runtime.getURL(`iconDataSourceGate.svg`),
    mexc: chrome.runtime.getURL(`iconDataSourceMEXC.svg`),
    huobi: chrome.runtime.getURL(`iconDataSourceHuobi.svg`),
  };
  var iconDataSource = iconMap[activeRequest.dataSource];

  // useEffect(() => {
  //   rem();
  // }, []);
  useEffect(() => {
    const lastStatus = sessionStorage.getItem('padoAttestRequestStatus');
    const lastIsReadyFetch = sessionStorage.getItem('padoAttestRequestReady');
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
        sessionStorage.setItem('padoAttestRequestReady', '1');
      }
      if (name === 'end') {
        console.log('222content receive:end', request, failReason);
        setStatus('result');
        setResultStatus(result);
        setErrorTxt(failReason);
      }
    };
    chrome.runtime.onMessage.addListener(listenerFn);
    return () => {
      chrome.runtime.onMessage.removeListener(listenerFn);
    };
  }, []);
  return (
    <div className={`pado-extension-card  ${status}`}>
      <div className="pado-extension-header">
        <img src={iconPado} className="iconPado" />
        <img src={iconLink} className="iconLink" />
        <img src={iconDataSource} className="iconSource" />
      </div>
      <div className="pado-extenstion-center">
        <div className="pado-extenstion-center-title">
          PADO Attestation Process
        </div>
        <DescEl
          status={status}
          resultStatus={resultStatus}
          errorTxt={errorTxt}
        />
      </div>
      <FooterEl
        status={status}
        setStatus={setStatus}
        isReadyFetch={isReadyFetch}
        resultStatus={resultStatus}
        errorTxt={errorTxt}
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
console.log('content_scripts-content-decode inject');
chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'initCompleted', // diff
  },
  (response, a, b) => {
    if (response.name === 'append') {
      console.log('content_scripts-content-decode receive:append');
      // hide in login page
      var disabledPathList = ['login', 'register'];
      var isDisabled = disabledPathList.some(
        (i) => window.location.href.indexOf(i) > -1
      );
      if (isDisabled) {
        return;
      }
      // avoid re-render
      if (activeRequest) {
        if (response.isReady) {
          sessionStorage.setItem('padoAttestRequestReady', '1');
        }
        return;
      }
      // render
      activeRequest = response.params;
      console.log('222response', response); //delete
      operationType = response.operation;
      const container = document.getElementById('pado-extension-content');
      const root = createRoot(container);
      root.render(<PadoCard />);
    }
  }
);
