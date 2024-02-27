var dataSourcePageTabId = null;
var intervalTimer = null;
var activeTemplate = {};
var moveFlag = false;
// var x, y;
function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}

var themeRootEl = document.querySelector('.theme-root');
var isThemeLight = !!themeRootEl && themeRootEl.classList.contains('light');

chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'injectionCompleted',
  },
  (response, a, b) => {
    if (response.name === 'append') {
      var pMaskEl = document.querySelector('#pado-mask');
      activeTemplate = response.params;
      dataSourcePageTabId = response.dataSourcePageTabId;
      if (pMaskEl) {
        return;
      }
      var {
        jumpTo,
        uiTemplate: { condition, subProofContent },
        processUiTemplate: { proofContent },
      } = activeTemplate;
      var aactiveOrigin = new URL(jumpTo).origin;
      var aactiveDesc = proofContent;
      var padoLeftStr = `<img class="pado-left"></img>`;
      var padoCenterTopStr = `<div class="pado-center-top">PADO Attestation Process</div>`;
      var padoCenterBottomStr = `<div class="pado-center-bottom"></div>`;

      var padoCenterBottomStartStr = `<button class="startBtn disabled" > Start</button>`;
      var padoCenterBottomCancelStr = `<button class="cancelBtn">Cancel</button>`;
      var padoCenterCenterStr = `<div class="pado-center-center"><p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Content</span><span>${aactiveDesc}</span></p></div>`;
      var padoCenterStr = `<div class="pado-center"></div>`;
      var padoRightStr = `<div class="pado-right">1/3</div>`;
      var padoMaskStr = '<div id="pado-mask"></div > ';
      var padoleftNode = createDomElement(padoLeftStr);
      var padoCenterNode = createDomElement(padoCenterStr);
      var padoCenterTopNode = createDomElement(padoCenterTopStr);
      var padoCenterBottomNode = createDomElement(padoCenterBottomStr);
      var padoCenterBottomOKNode = createDomElement(
        `<button class="okBtn">OK</button>`
      );
      var padoCenterBottomStartNode = createDomElement(
        padoCenterBottomStartStr
      );
      var disabledPathList = ['login', 'register'];
      var isDisabled = disabledPathList.some(
        (i) => window.location.href.indexOf(i) > -1
      );
      if (isDisabled) {
        // padoCenterBottomStartNode.classList.add('disabled');
        return;
      }
      var padoCenterBottomCancelNode = createDomElement(
        padoCenterBottomCancelStr
      );
      var padoCenterCenterNode = createDomElement(padoCenterCenterStr);
      var padoRightNode = createDomElement(`<div class="pado-right">1/3</div>`);
      var padoMaskNode = createDomElement(padoMaskStr);
      var onDrag = () => {
        var x, y;
        var mousemoveFn = (e) => {
          var _h = window.innerHeight - padoMaskNode.offsetHeight;
          var _w = window.innerWidth - padoMaskNode.offsetWidth;
          var div_left = e.clientX - x;
          var div_top = e.clientY - y;
          div_left = Math.min(Math.max(0, div_left), _w);
          div_top = Math.min(Math.max(0, div_top), _h);
          if (moveFlag) {
            padoMaskNode.style.left = div_left + 'px';
            padoMaskNode.style.top = div_top + 'px';
          }
        };
        var mousedownFn = (e) => {
          moveFlag = true;
          x = e.offsetX;
          y = e.offsetY;
          document.addEventListener('mousemove', mousemoveFn);
        };
        var mouseupFn = () => {
          document.removeEventListener('mousemove', mousemoveFn);
        };

        padoMaskNode.addEventListener('mousedown', mousedownFn);
        padoMaskNode.addEventListener('mouseup', mouseupFn);
      };
      onDrag();
      padoMaskNode.ondragstart = function () {
        return false;
      };
      if (themeRootEl) {
        if (isThemeLight) {
          padoMaskNode.classList.add('light');
        } else {
          padoMaskNode.classList.add('dark');
        }
      }
      padoleftNode.src = chrome.runtime.getURL(`iconExtension.svg`);

      padoCenterNode.appendChild(padoCenterTopNode);
      padoCenterNode.appendChild(padoCenterCenterNode);
      padoCenterNode.appendChild(padoCenterBottomNode);

      padoCenterBottomNode.appendChild(padoCenterBottomStartNode);
      padoCenterBottomNode.appendChild(padoCenterBottomCancelNode);

      padoMaskNode.appendChild(padoleftNode);
      padoMaskNode.appendChild(padoCenterNode);
      padoMaskNode.appendChild(padoRightNode);

      padoCenterBottomOKNode.onclick = () => {
        chrome.runtime.sendMessage({
          type: 'pageDecode',
          name: 'closeDataSourcePage',
          dataSourcePageTabId,
        });
        return;
      };
      padoCenterBottomCancelNode.onclick = () => {
        chrome.runtime.sendMessage({
          type: 'pageDecode',
          name: 'cancelAttest',
          dataSourcePageTabId,
        });
      };
      padoCenterBottomStartNode.onclick = () => {
        // if (isDisabled) {
        //   return;
        // }
        if (padoCenterBottomStartNode.classList.contains('disabled')) {
          return;
        }
        padoRightNode.innerHTML = '2/3';
        padoCenterCenterNode.innerHTML = `<p  class="loadingTxt">Connecting to PADO node...</p><div class="progress"><div class="progress-bar"><div class="bar"></div></div></div >`;

        padoCenterBottomNode.remove();
        // var progress = document.querySelector('.percent');
        var barEl = document.querySelector('.bar');
        var loadingTxtEl = document.querySelector('.loadingTxt');
        var progressPercentage = 0;

        function simulateFileUpload() { 
          progressPercentage += 1;
          if (progressPercentage > 0 && progressPercentage <= 1.25) {
            loadingTxtEl.innerHTML = 'Connecting to PADO node...';
          } else if (progressPercentage > 1.25 && progressPercentage <= 2.5) {
            loadingTxtEl.innerHTML = 'Connecting to data source...';
          } else if (progressPercentage > 2.5 && progressPercentage <= 5) {
            loadingTxtEl.innerHTML = 'MPC-TLS executing...';
          } else if (progressPercentage > 5 && progressPercentage <= 100) {
            loadingTxtEl.innerHTML = 'IZK proving and verifying...';
          }  else if (progressPercentage > 100) {
            loadingTxtEl.innerHTML = 'Attestation creation completed ...';
            progressPercentage = 100;
            clearInterval(intervalTimer);
            if (padoRightNode.innerHTML !== '3/3') {
              padoRightNode.innerHTML = '3/3';
              var str1 = `<p class="warn-tip">Something went wrong...</p><p>The process has been interrupted for some unknown reason. Please try again later.</p>`;
              padoCenterCenterNode.innerHTML = str1;
              padoCenterBottomOKNode = createDomElement(
                `<div class="pado-center-bottom"><button class="okBtn">OK</button></div>`
              );
              padoCenterBottomOKNode.onclick = () => {
                const padoMaskNode = document.querySelector('#pado-mask');

                document.body.removeChild(padoMaskNode);
                chrome.runtime.sendMessage({
                  type: 'pageDecode',
                  name: 'closeDataSourcePage',
                  dataSourcePageTabId,
                });
                return;
              };
              if (padoCenterNode.lastChild.className !== 'pado-center-bottom') {
                padoCenterNode.appendChild(padoCenterBottomOKNode);
              }
            }
          }
          barEl.style.width = `${progressPercentage}%`;
          // progress.innerHTML = `${progressPercentage}%`;
        }
        intervalTimer = setInterval(simulateFileUpload, (123 / 100) * 1000); // algorithm timeout
        var msgObj = {
          type: 'pageDecode',
          name: 'sendRequest',
        };
        chrome.runtime.sendMessage(msgObj, (response) => {});
      };
      document.body.appendChild(padoMaskNode);
    }
  }
);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  var {
    name,
    params: { result, failReason, isReady },
  } = request;
  if (name === 'attestResult') {
    var padoRightEl = document.querySelector('.pado-right');
    var padoCenterCenterEl = document.querySelector('.pado-center-center');
    var padoCenterEl = document.querySelector('.pado-center');
    var {
      jumpTo,
      uiTemplate: { condition, subProofContent },
      processUiTemplate: { proofContent, successMsg, failedMsg },
      event,
    } = activeTemplate;
    var aactiveOrigin = new URL(jumpTo).origin;
    var aactiveDesc = successMsg;
    var fn = (tryFlag) => {
      var btnTxt = tryFlag ? 'Try again' : 'OK';
      var padoCenterBottomOKNode = createDomElement(
        `<div class="pado-center-bottom"><button class="okBtn">${btnTxt}</button></div>`
      );
      padoCenterBottomOKNode.onclick = () => {
        chrome.runtime.sendMessage({
          type: 'pageDecode',
          name: 'closeDataSourcePage',
          dataSourcePageTabId,
          tryFlag,
        });
        return;
      };
      if (padoCenterEl.lastChild.className !== 'pado-center-bottom') {
        padoCenterEl.appendChild(padoCenterBottomOKNode);
      }
    };
    if (result === 'success') {
      padoRightEl.innerHTML = '3/3';
      var iconSuc = chrome.runtime.getURL(`iconSuc.svg`);
      padoCenterCenterEl.innerHTML = `<p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Result</span><span>${aactiveDesc}<img src=${iconSuc}></span></p>`;
      fn();
    } else if (result === 'fail') {
      aactiveDesc = failedMsg;
      padoRightEl.innerHTML = '3/3';
      padoCenterCenterEl.innerHTML = `<p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Result</span><span>${aactiveDesc}</span></p>`;
      fn();
    } else if (result === 'warn') {
      padoRightEl.innerHTML = '2/3';
     var str3 = `<p>Not meeting the uniqueness requirement...</p><p>This account may have already been bound to a wallet address, or your wallet address may already have a zkAttestation with another Binance account.</p>`;
      padoCenterCenterEl.innerHTML =
        failReason === 'Not meeting the uniqueness requirement.'
          ? str3
          : `<p class="warn-tip">${failReason.title}</p><p>${failReason.desc}</p>`;
      fn();
    }
  }
  if (name === 'webRequestIsReady') {
    let padoCenterBottomStartNode = document.querySelector('.startBtn');
    if (isReady) {
      const isDisabled =
        padoCenterBottomStartNode.classList.contains('disabled');
      if (isDisabled) {
        padoCenterBottomStartNode.classList.remove('disabled');
      }
    }
  }
});
