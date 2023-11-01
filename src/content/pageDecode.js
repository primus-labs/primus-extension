
  let dataSourcePageTabId = null;
  let intervalTimer = null;
  let activeTemplate = {};
  let moveFlag = false;
  // let x, y;
  function createDomElement(html) {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    return dom.body.firstElementChild;
  }

  const themeRootEl = document.querySelector('.theme-root');
  const isThemeLight = !!themeRootEl && themeRootEl.classList.contains('light');

  chrome.runtime.sendMessage(
    {
      type: 'pageDecode',
      name: 'injectionCompleted',
    },
    (response, a, b) => {
      if (response.name === 'append') {
        activeTemplate = response.params;
        dataSourcePageTabId = response.dataSourcePageTabId;
        const {
          jumpTo,
          uiTemplate: { proofContent, condition, subProofContent },
        } = activeTemplate;
        const aactiveOrigin = new URL(jumpTo).origin;
        const aactiveDesc = `${proofContent ?? ''} ${subProofContent ?? ''} ${
          condition ?? ''
        }`;
        const padoLeftStr = `<img class="pado-left"></img>`;
        const padoCenterTopStr = `<div class="pado-center-top">PADO Attestation Process</div>`;
        const padoCenterBottomStr = `<div class="pado-center-bottom"></div>`;

        const padoCenterBottomStartStr = `<button class="startBtn" > Start</button>`;
        const padoCenterBottomCancelStr = `<button class="cancelBtn">Cancel</button>`;
        const padoCenterCenterStr = `<div class="pado-center-center"><p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Content</span><span>${aactiveDesc}</span></p></div>`;
        const padoCenterStr = `<div class="pado-center"></div>`;
        const padoRightStr = `<div class="pado-right">1/3</div>`;
        const padoMaskStr = '<div id="pado-mask"></div > ';
        const padoleftNode = createDomElement(padoLeftStr);
        const padoCenterNode = createDomElement(padoCenterStr);
        const padoCenterTopNode = createDomElement(padoCenterTopStr);
        let padoCenterBottomNode = createDomElement(padoCenterBottomStr);
        const padoCenterBottomOKNode = createDomElement(
          `<button class="okBtn">OK</button>`
        );
        const padoCenterBottomStartNode = createDomElement(
          padoCenterBottomStartStr
        );
        const disabledPathList = ['login', 'register'];
        const isDisabled = disabledPathList.some(
          (i) => window.location.href.indexOf('login') > -1
        );
        if (isDisabled) {
          padoCenterBottomStartNode.classList.add('disabled');
        }
        const padoCenterBottomCancelNode = createDomElement(
          padoCenterBottomCancelStr
        );
        let padoCenterCenterNode = createDomElement(padoCenterCenterStr);
        const padoRightNode = createDomElement(
          `<div class="pado-right">1/3</div>`
        );
        const padoMaskNode = createDomElement(padoMaskStr);
        const onDrag = () => {
          let x, y;
          const mousemoveFn = (e) => {
            let _h = window.innerHeight - padoMaskNode.offsetHeight;
            let _w = window.innerWidth - padoMaskNode.offsetWidth;
            let div_left = e.clientX - x;
            let div_top = e.clientY - y;
            div_left = Math.min(Math.max(0, div_left), _w);
            div_top = Math.min(Math.max(0, div_top), _h);
            if (moveFlag) {
              padoMaskNode.style.left = div_left + 'px';
              padoMaskNode.style.top = div_top + 'px';
            }
          };
          const mousedownFn = (e) => {
            moveFlag = true;
            x = e.offsetX;
            y = e.offsetY;
            document.addEventListener('mousemove', mousemoveFn);
          };
          const mouseupFn = () => {
            document.removeEventListener('mousemove', mousemoveFn);
          };

          padoMaskNode.addEventListener('mousedown', mousedownFn);
          padoMaskNode.addEventListener('mouseup', mouseupFn);
        };
        onDrag();

        // padoMaskNode.onmousedown = function (event) {

        // let shiftX = event.clientX - padoMaskNode.getBoundingClientRect().left;
        // let shiftY = event.clientY - padoMaskNode.getBoundingClientRect().top;
        // padoMaskNode.style.position = 'absolute';
        // padoMaskNode.style.zIndex = 9999;
        // moveAt(event.pageX, event.pageY);
        // function moveAt(pageX, pageY) {
        //   padoMaskNode.style.left = pageX - shiftX + 'px';
        //   padoMaskNode.style.top = pageY - shiftY + 'px';
        // }
        // function onMouseMove(event) {
        //   moveAt(event.pageX, event.pageY);
        // }

        // document.addEventListener('mousemove', onMouseMove);
        // padoMaskNode.onmouseup = function () {
        //   document.removeEventListener('mousemove', onMouseMove);
        //   padoMaskNode.onmouseup = null;
        // };
        // };
        padoMaskNode.ondragstart = function () {
          return false;
        };
        if (isThemeLight) {
          padoMaskNode.classList.add('light');
        } else {
          padoMaskNode.classList.add('dark');
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
          if (isDisabled) {
            return;
          }
          padoRightNode.innerHTML = '2/3';
          padoCenterCenterNode.innerHTML = `<p>Verifying...</p><div class="progress"><div class="progress-bar"><div class="bar"></div></div></div >`;

          padoCenterBottomNode.remove();
          // const progress = document.querySelector('.percent');
          const barEl = document.querySelector('.bar');
          let progressPercentage = 0;

          function simulateFileUpload() {
            progressPercentage += 1;
            if (progressPercentage > 100) {
              progressPercentage = 100;
              clearInterval(intervalTimer);
            }
            barEl.style.width = `${progressPercentage}%`;
            // progress.innerHTML = `${progressPercentage}%`;
          }
          intervalTimer = setInterval(simulateFileUpload, (100 / 110) * 1000); // algorithm timeout
          const msgObj = {
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
    const {
      name,
      params: { result, failReason },
    } = request;
    if (name === 'attestResult') {
      const padoRightEl = document.querySelector('.pado-right');
      const padoCenterCenterEl = document.querySelector('.pado-center-center');
      const padoCenterEl = document.querySelector('.pado-center');
      const {
        jumpTo,
        uiTemplate: { proofContent, condition, subProofContent },
      } = activeTemplate;
      const aactiveOrigin = new URL(jumpTo).origin;
      const aactiveDesc = `${subProofContent ?? ''} ${condition ?? ''}`;
      if (result === 'success') {
        padoRightEl.innerHTML = '3/3';
        const iconSuc = chrome.runtime.getURL(`iconSuc.svg`);
        padoCenterCenterEl.innerHTML = `<p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Result</span><span>${aactiveDesc}<img src=${iconSuc}></span></p>`;
        const padoCenterBottomOKNode = createDomElement(
          `<div class="pado-center-bottom"><button class="okBtn">OK</button></div>`
        );
        padoCenterBottomOKNode.onclick = () => {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'closeDataSourcePage',
            dataSourcePageTabId,
          });
          return;
        };
        padoCenterEl.appendChild(padoCenterBottomOKNode);
      } else if (result === 'fail') {
        padoRightEl.innerHTML = '3/3';
        padoCenterCenterEl.innerHTML = `<p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Result</span><span>Not eligible</span></p>`;
      } else if (result === 'warn') {
        const str1 = `<p class="warn-tip">Something went wrong...</p><p>The process has been interrupted for some unknown reason. Please try again later.</p>`;
        const str2 = `<p>Ooops...</p><p>Unstable internet connection. Please try again later.</p>`;
        padoCenterCenterEl.innerHTML = failReason === 'network' ? str2 : str1;
        const padoCenterBottomOKNode = createDomElement(
          `<div class="pado-center-bottom"><button class="okBtn">OK</button></div>`
        );
        padoCenterBottomOKNode.onclick = () => {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'closeDataSourcePage',
            dataSourcePageTabId,
          });
          return;
        };
        padoCenterEl.appendChild(padoCenterBottomOKNode);
      }
    }
  });

