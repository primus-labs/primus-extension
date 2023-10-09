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
  (response) => {
    console.log(
      '222222web received response (injectionCompleted) response:',
      response
    );
    if (response.name === 'append') {
      activeTemplate = response.params;
      const {
        jumpTo,
        uiTemplate: { proofContent, condition },
      } = response.params;
      const aactiveOrigin = new URL(jumpTo).origin;
      const aactiveDesc = `${proofContent}(${condition})`;
      const padoLeftStr = `<img class="pado-left"></img>`;
      const padoCenterTopStr = `<div class="pado-center-top">PADO Attestation Process</div>`;
      const padoCenterBottomStr = `<div class="pado-center-bottom"></div>`;

      const padoCenterBottomStartStr = `<button class="startBtn" > Start</button>`;
      const padoCenterBottomCancelStr = `<button class="cancelBtn">Cancel</button>`;
      const padoCenterCenterStr = `<div class="pado-center-center"><p><span>Data Source</span><span>${aactiveOrigin}</span></p><p><span>Condition</span><span>${aactiveDesc}</span></p></div>`;
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
        '<div class="progress"><div class="progress-bar"><div class="bg"></div><div class="bar"></div></div><div class="percent">75%</div></div > '
      );

      padoCenterBottomOKNode.onclick = () => {
        // if (padoRightNode.innerHTML === '3/3') {
          chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'closeDataSourcePage',
          });
          return;
        // } else {
        //   padoRightNode.innerHTML = '3/3';
        //   padoCenterCenterNode.innerHTML = padoCenterCenterStr;
        // }
      };
      padoCenterBottomCancelNode.onclick = () => {
        chrome.runtime.sendMessage({
          type: 'pageDecode',
          name: 'closeDataSourcePage',
        });
      };
      padoCenterBottomStartNode.onclick = () => {
        padoRightNode.innerHTML = '2/3';

        padoCenterCenterNode.innerHTML = `<p>Verifying...</p><div class="progress"><div class="progress-bar"><div class="bar"></div></div><div class="percent">75%</div></div >`;
        padoCenterBottomNode.removeChild(padoCenterBottomNode.childNodes[0]);
        padoCenterBottomNode.removeChild(padoCenterBottomNode.childNodes[0]);
        padoCenterBottomNode.appendChild(padoCenterBottomOKNode);
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
    if (result === 'success') {
      alert(result);
      // document.querySelector('pado-right)
      //   padoRightNode.innerHTML = '3/3';
      //   padoCenterCenterNode.innerHTML = padoCenterCenterStr;
    } else if (result === 'warn') {
      alert(result);
    } else if (result === 'fail') {
      alert(result);
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