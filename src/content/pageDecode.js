chrome.runtime.sendMessage({
  name: 'webReceived',
});
chrome.runtime.onMessage.addListener((msg) => {
  console.log('webReceived', msg);
});
function createDomElement(html) {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}
const padoMaskStr =
  '<div id="pado-mask" draggable><button class="creatBtn" > Creat PADO Proof</button ></div > ';
const padoMaskNode = createDomElement(padoMaskStr);

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

document.body.appendChild(padoMaskNode);

alert('Injection completed');
