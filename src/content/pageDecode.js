
function createDomElement(html) {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
const padoMaskStr =
  '<div id="pado-mask" draggable><button class="creatBtn" > Creat PADO Proof</button ></div > ';
const padoMaskNode = createDomElement(padoMaskStr);
padoMaskNode.onclick = () => {
  console.log('cookies', document.cookie);
  const msgObj = {
      type: 'pageDecode',
      name: 'sendRequest',
    }
  chrome.runtime.sendMessage(msgObj, (response) => {
    console.log('222222web received (sendRequest) response:', response);
  });
}
padoMaskNode.onmousedown = function (event) {
  let shiftX = event.clientX - padoMaskNode.getBoundingClientRect().left;
  let shiftY = event.clientY - padoMaskNode.getBoundingClientRect().top;
  padoMaskNode.style.position = 'absolute';
  padoMaskNode.style.zIndex = 9999;
  moveAt(event.pageX, event.pageY); // 移动现在位于坐标 (pageX, pageY) 上的球
  // 将初始的偏移考虑在内
  function moveAt(pageX, pageY) {
    padoMaskNode.style.left = pageX - shiftX + 'px';
    padoMaskNode.style.top = pageY - shiftY + 'px';
  }
  function onMouseMove(event) {
    moveAt(event.pageX, event.pageY);
  }
  // 在 mousemove 事件上移动球
  document.addEventListener('mousemove', onMouseMove);
  // 放下球，并移除不需要的处理程序
  padoMaskNode.onmouseup = function () {
    document.removeEventListener('mousemove', onMouseMove);
    padoMaskNode.onmouseup = null;
  };
};
padoMaskNode.ondragstart = function () {
  return false;
};
var cookies = document.cookie;

chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'injectionCompleted',
  },
  (response) => {
    console.log('222222web received (injectionCompleted) response:', response);
    document.body.appendChild(padoMaskNode);
    if (response.name === 'append') {
    }
  }
);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('web received:', request);
});
