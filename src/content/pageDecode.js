window.onload = () => {
  let intervalTimer = null
  let activeTemplate = {};
  function createDomElement(html) {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    return dom.body.firstElementChild;
  }

  const themeRootEl = document.querySelector('.theme-root');
  const isThemeLight = themeRootEl.classList.contains('light');

  chrome.runtime.sendMessage(
    {
      type: 'pageDecode',
      name: 'injectionCompleted',
    },
    (response, a,b) => {
      console.log(
        '222222web received response (injectionCompleted) response:',
        response,a,b
      );
      if (response.name === 'append') {
        activeTemplate = response.params;
        const {
          jumpTo,
          uiTemplate: { proofContent, condition, subProofContent },
        } = activeTemplate;
        const aactiveOrigin = new URL(jumpTo).origin;
        const aactiveDesc = `${proofContent ?? ''} ${subProofContent ?? ''} ${condition ?? ''}`;
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
        const padoCenterBottomCancelNode = createDomElement(
          padoCenterBottomCancelStr
        );
        let padoCenterCenterNode = createDomElement(padoCenterCenterStr);
        const padoRightNode = createDomElement(
          `<div class="pado-right">1/3</div>`
        );
        const padoMaskNode = createDomElement(padoMaskStr);
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

        const VerifyingNode = createDomElement('<p>Verifying...</p > ');
        const ProgressNode = createDomElement(
          '<div class="progress"><div class="progress-bar"><div class="bg"></div><div class="bar"></div></div><div class="percent">0%</div></div > '
        );

        padoCenterBottomOKNode.onclick = () => {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'closeDataSourcePage',
          });
          return;
        };
        padoCenterBottomCancelNode.onclick = () => {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'cancelAttest',
          });
        };
        padoCenterBottomStartNode.onclick = () => {
          padoRightNode.innerHTML = '2/3';
          padoCenterCenterNode.innerHTML = `<p>Verifying...</p><div class="progress"><div class="progress-bar"><div class="bar"></div></div></div >`;
        
          padoCenterBottomNode.removeChild(padoCenterBottomNode.childNodes[0]);
          padoCenterBottomNode.removeChild(padoCenterBottomNode.childNodes[0]);
          // padoCenterBottomNode.appendChild(padoCenterBottomOKNode);
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
          intervalTimer = setInterval(simulateFileUpload, 100/130 *1000); // algorithm timeout
          const msgObj = {
            type: 'pageDecode',
            name: 'sendRequest',
          };
          chrome.runtime.sendMessage(msgObj, (response) => {
            console.log('222222web received (sendRequest) response:', response);
          });
        };
        document.body.appendChild(padoMaskNode);
      }
    }
  );
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('2222223web received:', request);
    const {
      name,
      params: { result },
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
          });
          return;
        };
        padoCenterEl.appendChild(padoCenterBottomOKNode);
      } else if (result === 'fail') {
        padoRightEl.innerHTML = '3/3';
        padoCenterCenterEl.innerHTML = `<p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Proof Result</span><span>Not eligible</span></p>`;
      }else if (result === 'warn') {
        padoCenterCenterEl.innerHTML = `<p class="warn-tip">The process has been interrupted...</p><p>Please try again later.</p>`;
        const padoCenterBottomOKNode = createDomElement(
          `<div class="pado-center-bottom"><button class="okBtn">OK</button></div>`
        );
        padoCenterBottomOKNode.onclick = () => {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'closeDataSourcePage',
          });
          return;
        };
        padoCenterEl.appendChild(padoCenterBottomOKNode);
      }
    }
  });

  // padoMaskNode.onmousedown = function (event) {
  //   let shiftX = event.clientX - padoMaskNode.getBoundingClientRect().left;
  //   let shiftY = event.clientY - padoMaskNode.getBoundingClientRect().top;
  //   padoMaskNode.style.position = 'absolute';
  //   padoMaskNode.style.zIndex = 9999;
  //   moveAt(event.pageX, event.pageY);
  //   function moveAt(pageX, pageY) {
  //     padoMaskNode.style.left = pageX - shiftX + 'px';
  //     padoMaskNode.style.top = pageY - shiftY + 'px';
  //   }
  //   function onMouseMove(event) {
  //     moveAt(event.pageX, event.pageY);
  //   }

  //   document.addEventListener('mousemove', onMouseMove);
  //   padoMaskNode.onmouseup = function () {
  //     document.removeEventListener('mousemove', onMouseMove);
  //     padoMaskNode.onmouseup = null;
  //   };
  // };
  // padoMaskNode.ondragstart = function () {
  //   return false;
  // };
  // var cookies = document.cookie;
};
