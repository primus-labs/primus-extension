let activeTemplate = {}
function createDomElement(html) {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}

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

chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'injectionCompleted',
  },
  (response) => {
    console.log('222222web received response (injectionCompleted) response:', response);
    if (response.name === 'append') {
      activeTemplate = response.params
      const {
        jumpTo,
        uiTemplate: { proofContent, condition },
      } = response.params;
      const aactiveOrigin = new URL(jumpTo).origin;
      const aactiveDesc = `${proofContent}(${condition})`;
      const padoLeftStr = `<div class="pado-left"></div>`;
      const padoCenterTitleStr = `<h1>PADO Attestation Process</h1>`;
      const btnsWrapperStr = `<div class="btns-wrapper"><button class="creatBtn" > Start</button> < button class="cancelBtn" >Cancel</ button></div>`;
      const padoCenterMainStr = `<h6><span>Data Source</span><span>${aactiveOrigin}</span></h6><p><span>Condition</span>${aactiveDesc}<span></span></p></div>`;
      const padoCenterStr = `<div class="pado-center"></div>`;
      const padoRightStr = `<div class="pado-right">1/3</div>`
      const padoMaskStr ='<div id="pado-mask"></div > ';
      const padoleftNode = createDomElement(padoLeftStr);
      const padoCenterNode = createDomElement(padoCenterStr);
      
      const padoCenterTitleNode = createDomElement(padoCenterTitleStr);
      
      const padoBtnsWrapperNode = createDomElement(btnsWrapperStr);
      const padoCenterMainNode = createDomElement(padoCenterMainStr);
      const padoRightNode = createDomElement(padoRightStr);
      const padoMaskNode = createDomElement(padoMaskStr);
      padoCenterMainNode.appendChild(padoBtnsWrapperNode);
      padoCenterNode.appendChild(padoCenterTitleNode);
      padoCenterNode.appendChild(padoCenterMainNode);
      padoMaskNode.appendChild(padoleftNode);
      padoMaskNode.appendChild(padoCenterNode);
      padoMaskNode.appendChild(padoRightNode);
      padoBtnsWrapperNode.onclick = () => {
        console.log('cookies', document.cookie);
        padoCenterNode.innerHTML = 'processing...';
        const msgObj = {
          type: 'pageDecode',
          name: 'sendRequest',
          // params: {
          //   id: '1',
          // },
        };
        chrome.runtime.sendMessage(msgObj, (response) => {
          console.log('222222web received (sendRequest) response:', response);
        });
      };
      document.body.appendChild(padoMaskNode);
    }
    // if (response.name === 'attestSuc') {
    //   alert('Success2');
    // }
  }
);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('2222223web received:', request);
  const {name} = request
  if (name === 'attestSuc') {
    alert('Atttest Success');
  }
});
